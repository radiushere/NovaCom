#include "../include/Graph.hpp"
#include "../include/DirectChat.hpp" 
#include <fstream>
#include <sstream>
#include <algorithm>
#include <ctime>

using namespace std;

// --- Helpers ---
int safeStoi(string s) {
    if (s.empty()) return 0;
    try { return stoi(s); } catch (...) { return 0; }
}

string getCurrentTime() {
    time_t now = time(0);
    tm *ltm = localtime(&now);
    char buffer[20];
    sprintf(buffer, "%02d:%02d", ltm->tm_hour, ltm->tm_min);
    return string(buffer);
}

vector<string> NovaGraph::split(const string& s, char delimiter) {
    vector<string> tokens;
    string token;
    istringstream tokenStream(s);
    while (getline(tokenStream, token, delimiter)) {
        tokens.push_back(token);
    }
    return tokens;
}

string jsonEscape(const string& s) {
    string output;
    for (char c : s) {
        if (c == '"') output += "\\\"";
        else if (c == '\\') output += "\\\\";
        else output += c;
    }
    return output;
}

string sanitize(string input) {
    replace(input.begin(), input.end(), '\n', ' ');
    replace(input.begin(), input.end(), '|', ' ');
    return input;
}

string getDMKey(int u, int v) {
    if (u < v) return to_string(u) + "_" + to_string(v);
    return to_string(v) + "_" + to_string(u);
}

// ==========================================
// PERSISTENCE
// ==========================================

void NovaGraph::loadData() {
    string line;

    // 1. Load Users 
    ifstream userFile("data/users.txt");
    if (userFile.is_open()) {
        while (getline(userFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, '|');
            if (parts.size() >= 7) {
                User u;
                u.id = safeStoi(parts[0]);
                u.username = parts[1];
                u.email = parts[2];
                u.password = parts[3];
                u.avatarUrl = parts[4];
                u.tags = split(parts[5], ',');
                u.karma = safeStoi(parts[6]);
                if (u.id != 0) {
                    userDB[u.id] = u;
                    usernameIndex[u.username] = u.id;
                }
            }
        }
        userFile.close();
    }

    // 2. Load Graph
    ifstream graphFile("data/graph.txt");
    if (graphFile.is_open()) {
        while (getline(graphFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, ',');
            int id = safeStoi(parts[0]);
            vector<int> friends;
            for (size_t i = 1; i < parts.size(); i++) {
                int fid = safeStoi(parts[i]);
                if(fid != id && fid != 0) friends.push_back(fid);
            }
            sort(friends.begin(), friends.end());
            friends.erase(unique(friends.begin(), friends.end()), friends.end());
            adjList[id] = friends;
        }
        graphFile.close();
    }

    // 3. Load Communities
    // Format: ID|Name|Desc|Cover|Tags|Members|Mods|Bans|Admins
    ifstream commFile("data/communities.txt");
    if (commFile.is_open()) {
        while (getline(commFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, '|');
            if (parts.size() >= 5) { 
                Community c;
                c.id = safeStoi(parts[0]);
                c.name = parts[1];
                c.description = parts[2];
                c.coverUrl = parts[3]; 
                auto tagList = split(parts[4], ',');
                for(auto t : tagList) if(!t.empty()) c.tags.push_back(t);

                if (parts.size() > 5 && parts[5] != "NULL") {
                    auto memList = split(parts[5], ',');
                    for(auto m : memList) { int mid = safeStoi(m); if(mid!=0) c.members.insert(mid); }
                }
                if (parts.size() > 6 && parts[6] != "NULL") {
                    auto modList = split(parts[6], ',');
                    for(auto m : modList) { int mid = safeStoi(m); if(mid!=0) c.moderators.insert(mid); }
                }
                if (parts.size() > 7 && parts[7] != "NULL") {
                    auto banList = split(parts[7], ',');
                    for(auto b : banList) { int bid = safeStoi(b); if(bid!=0) c.bannedUsers.insert(bid); }
                }
                // LOAD ADMINS (New)
                if (parts.size() > 8 && parts[8] != "NULL") {
                    auto adminList = split(parts[8], ',');
                    for(auto a : adminList) { int aid = safeStoi(a); if(aid!=0) c.admins.insert(aid); }
                }

                if (c.id != 0) {
                    communityDB[c.id] = c;
                    if (c.id >= nextCommunityId) nextCommunityId = c.id + 1;
                }
            }
        }
        commFile.close();
    }

    // 4. Load Chats
    ifstream chatFile("data/chats.txt");
    if (chatFile.is_open()) {
        while (getline(chatFile, line)) {
            auto parts = split(line, '|');
            if (parts.size() >= 7) {
                int commId = safeStoi(parts[0]);
                if (communityDB.find(commId) != communityDB.end()) {
                    Message m;
                    m.senderId = safeStoi(parts[1]);
                    m.senderName = parts[2];
                    m.timestamp = parts[3];
                    m.upvoters.clear();
                    if (parts[4] != "0" && parts[4] != "") {
                         auto voterList = split(parts[4], ',');
                         for(auto v : voterList) { int vid = safeStoi(v); if(vid!=0) m.upvoters.insert(vid); }
                    }
                    m.isPinned = (parts[5] == "1");
                    m.content = parts[6];
                    for (size_t i = 7; i < parts.size(); i++) m.content += " " + parts[i];
                    communityDB[commId].chatHistory.push_back(m);
                }
            }
        }
        chatFile.close();
    }
	
	// 5. Load DMs (New)
    // Format: Key|MsgID|SenderID|Time|ReplyID|Reaction|IsSeen|Content
    ifstream dmFile("data/dms.txt");
    if (dmFile.is_open()) {
        string line;
        while (getline(dmFile, line)) {
            auto parts = split(line, '|');
            if (parts.size() >= 8) {
                string key = parts[0];
                DirectMessage m;
                m.id = safeStoi(parts[1]);
                m.senderId = safeStoi(parts[2]);
                m.timestamp = parts[3];
                m.replyToMsgId = safeStoi(parts[4]);
                m.reaction = (parts[5] == "NONE") ? "" : parts[5];
                m.isSeen = (parts[6] == "1");
                m.content = parts[7];
                // Reassemble content if pipes existed
                for (size_t i = 8; i < parts.size(); i++) m.content += " " + parts[i];

                dmDB[key].chatKey = key;
                dmDB[key].messages.push_back(m);
                // Ensure ID counter is correct
                if (m.id >= dmDB[key].nextMsgId) dmDB[key].nextMsgId = m.id + 1;
            }
        }
        dmFile.close();
    }
}


void NovaGraph::saveData() {
    // 1. Save Users
    ofstream userFile("data/users.txt");
    for (auto const& [id, u] : userDB) {
        string tagStr = "";
        for(size_t i=0; i<u.tags.size(); i++) tagStr += u.tags[i] + (i<u.tags.size()-1 ? "," : "");
        if(tagStr.empty()) tagStr = "None";
        userFile << u.id << "|" << u.username << "|" << u.email << "|" << u.password << "|" 
                 << (u.avatarUrl.empty() ? "NULL" : u.avatarUrl) << "|" << tagStr << "|" << u.karma << "\n";
    }
    userFile.close();

    // 2. Save Graph
    ofstream graphFile("data/graph.txt");
    for (auto& [id, friends] : adjList) {
        sort(friends.begin(), friends.end());
        friends.erase(unique(friends.begin(), friends.end()), friends.end());
        graphFile << id;
        for (int friendID : friends) graphFile << "," << friendID;
        graphFile << "\n";
    }
    graphFile.close();

    // 3. Save Communities
    ofstream commFile("data/communities.txt");
    for (auto const& [id, c] : communityDB) {
        commFile << c.id << "|" << c.name << "|" << c.description << "|" << (c.coverUrl.empty() ? "NULL" : c.coverUrl) << "|";
        for(size_t i=0; i<c.tags.size(); i++) commFile << c.tags[i] << (i < c.tags.size()-1 ? "," : "");
        commFile << "|";
        if(c.members.empty()) commFile << "NULL";
        else { int i=0; for(int m:c.members) { commFile << m << (i<c.members.size()-1?",":""); i++; } }
        commFile << "|";
        if(c.moderators.empty()) commFile << "NULL";
        else { int i=0; for(int m:c.moderators) { commFile << m << (i<c.moderators.size()-1?",":""); i++; } }
        commFile << "|";
        if(c.bannedUsers.empty()) commFile << "NULL";
        else { int i=0; for(int m:c.bannedUsers) { commFile << m << (i<c.bannedUsers.size()-1?",":""); i++; } }
        commFile << "|";
        // SAVE ADMINS
        if(c.admins.empty()) commFile << "NULL";
        else { int i=0; for(int a:c.admins) { commFile << a << (i<c.admins.size()-1?",":""); i++; } }
        commFile << "\n";
    }
    commFile.close();

    // 4. Save Chats
    ofstream chatFile("data/chats.txt");
    for (auto const& [commId, comm] : communityDB) {
        for (const auto& msg : comm.chatHistory) {
            chatFile << commId << "|" << msg.senderId << "|" << msg.senderName << "|" << msg.timestamp << "|";
            if (msg.upvoters.empty()) chatFile << "0";
            else { int i=0; for(int uid : msg.upvoters) { chatFile << uid << (i < msg.upvoters.size()-1 ? "," : ""); i++; } }
            chatFile << "|" << (msg.isPinned ? "1" : "0") << "|" << sanitize(msg.content) << "\n";
        }
    }
    chatFile.close();
	
	// 5. Save DMs
    ofstream dmFile("data/dms.txt");
    for (auto const& [key, chat] : dmDB) {
        for (const auto& m : chat.messages) {
            dmFile << key << "|"
                   << m.id << "|"
                   << m.senderId << "|"
                   << m.timestamp << "|"
                   << m.replyToMsgId << "|"
                   << (m.reaction.empty() ? "NONE" : m.reaction) << "|"
                   << (m.isSeen ? "1" : "0") << "|"
                   << sanitize(m.content) << "\n";
        }
    }
    dmFile.close();
}

// ==========================================
// CORE LOGIC
// ==========================================

int NovaGraph::registerUser(string username, string email, string password, string avatar, string tags) {
    if (usernameIndex.find(username) != usernameIndex.end()) return -1;
    int newId = 1;
    if (!userDB.empty()) {
        int maxId = 0;
        for (auto const& [id, u] : userDB) if (id > maxId) maxId = id;
        newId = maxId + 1;
    }
    User u; u.id = newId; u.username = username; u.email = email; u.password = password; u.avatarUrl = avatar; u.tags = split(tags, ','); u.karma = 0;
    userDB[newId] = u; usernameIndex[username] = newId;
    saveData();
    return newId;
}

int NovaGraph::loginUser(string username, string password) {
    if (usernameIndex.find(username) == usernameIndex.end()) return -1;
    int id = usernameIndex[username];
    if (userDB[id].password == password) return id;
    return -1;
}

void NovaGraph::updateUserProfile(int id, string email, string avatar, string tags) {
    if (userDB.find(id) != userDB.end()) {
        userDB[id].email = email; userDB[id].avatarUrl = avatar; userDB[id].tags = split(tags, ',');
        saveData();
    }
}

void NovaGraph::addUser(int id, string username) {
    if (userDB.find(id) != userDB.end()) return;
    User u; u.id = id; u.username = username; u.karma = 0;
    userDB[id] = u;
}

void NovaGraph::addFriendship(int u, int v) {
    if (u == v) return;
    auto& uFriends = adjList[u];
    if (find(uFriends.begin(), uFriends.end(), v) != uFriends.end()) return;
    adjList[u].push_back(v); adjList[v].push_back(u);
}

void NovaGraph::createCommunity(string name, string desc, string tags, int creatorId, string coverUrl) {
    Community c; c.id = nextCommunityId++; c.name = name; c.description = desc; c.coverUrl = coverUrl; c.tags = split(tags, ',');
    c.members.insert(creatorId); c.moderators.insert(creatorId);
    communityDB[c.id] = c;
}

void NovaGraph::joinCommunity(int userId, int commId) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        if (c.bannedUsers.count(userId)) return;
        c.members.insert(userId);
        if (c.moderators.empty()) c.moderators.insert(userId);
    }
}

void NovaGraph::leaveCommunity(int userId, int commId) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        c.members.erase(userId);
        if (c.admins.count(userId)) c.admins.erase(userId);
        if (c.moderators.count(userId)) {
            c.moderators.erase(userId);
            if (c.moderators.empty() && !c.members.empty()) c.moderators.insert(*c.members.begin());
        }
    }
}

void NovaGraph::addMessage(int commId, int senderId, string content) {
    if (communityDB.find(commId) != communityDB.end()) {
        if (communityDB[commId].members.count(senderId)) {
            Message m; m.senderId = senderId; m.senderName = userDB[senderId].username; 
            m.content = sanitize(content); m.timestamp = getCurrentTime(); m.upvoters.clear(); m.isPinned = false;
            communityDB[commId].chatHistory.push_back(m);
            saveData();
        }
    }
}

// ==========================================
// MODERATION & ADMIN
// ==========================================

// THE MISSING FUNCTIONS:

void NovaGraph::promoteToAdmin(int commId, int actorId, int targetId) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        // Only Moderator can promote to admin
        if (c.moderators.count(actorId)) {
            c.admins.insert(targetId);
            saveData();
        }
    }
}

void NovaGraph::demoteAdmin(int commId, int actorId, int targetId) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        // Only Moderator can demote
        if (c.moderators.count(actorId)) {
            c.admins.erase(targetId);
            saveData();
        }
    }
}

void NovaGraph::transferOwnership(int commId, int actorId, int targetId) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        // Only Moderator can transfer
        if (c.moderators.count(actorId)) {
            c.moderators.erase(actorId);
            c.moderators.insert(targetId);
            // Ensure new mod isn't in admin list
            c.admins.erase(targetId);
            // Old mod becomes regular member (or admin if we wanted, but let's say regular)
            saveData();
        }
    }
}

void NovaGraph::banUser(int commId, int actorId, int targetId) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        bool isMod = c.moderators.count(actorId);
        bool isAdmin = c.admins.count(actorId);
        
        // Cannot ban moderator
        if (c.moderators.count(targetId)) return;

        if (isMod) {
            c.members.erase(targetId); c.admins.erase(targetId); c.bannedUsers.insert(targetId);
            saveData();
        } else if (isAdmin) {
            // Admin cannot ban other admins
            if (!c.admins.count(targetId)) {
                c.members.erase(targetId); c.bannedUsers.insert(targetId);
                saveData();
            }
        }
    }
}

void NovaGraph::unbanUser(int commId, int adminId, int targetId) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        bool isMod = c.moderators.count(adminId);
        bool isAdmin = c.admins.count(adminId);
        if (isMod || isAdmin) { c.bannedUsers.erase(targetId); saveData(); }
    }
}

void NovaGraph::deleteMessage(int commId, int adminId, int msgIndex) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        bool isMod = c.moderators.count(adminId);
        bool isAdmin = c.admins.count(adminId);
        if ((isMod || isAdmin) && msgIndex >= 0 && msgIndex < c.chatHistory.size()) {
            c.chatHistory.erase(c.chatHistory.begin() + msgIndex); saveData();
        }
    }
}

void NovaGraph::pinMessage(int commId, int adminId, int msgIndex) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        bool isMod = c.moderators.count(adminId);
        bool isAdmin = c.admins.count(adminId);
        if ((isMod || isAdmin) && msgIndex >= 0 && msgIndex < c.chatHistory.size()) {
            Message& targetMsg = c.chatHistory[msgIndex];
            if (!targetMsg.isPinned) {
                int pinCount = 0; int firstPinIndex = -1;
                for(int i=0; i<c.chatHistory.size(); i++) { if (c.chatHistory[i].isPinned) { pinCount++; if (firstPinIndex == -1) firstPinIndex = i; } }
                if (pinCount >= 2 && firstPinIndex != -1) c.chatHistory[firstPinIndex].isPinned = false;
                targetMsg.isPinned = true;
            } else { targetMsg.isPinned = false; }
            saveData();
        }
    }
}

void NovaGraph::upvoteMessage(int commId, int userId, int msgIndex) {
    if (communityDB.find(commId) != communityDB.end()) {
        Community& c = communityDB[commId];
        if (msgIndex >= 0 && msgIndex < c.chatHistory.size()) {
            Message& m = c.chatHistory[msgIndex];
            if (m.upvoters.count(userId)) m.upvoters.erase(userId);
            else { m.upvoters.insert(userId); if (userDB.find(m.senderId) != userDB.end()) userDB[m.senderId].karma += 5; }
            saveData();
        }
    }
}

// ==========================================
// JSON RESPONSES
// ==========================================

string NovaGraph::getCommunityMembersJSON(int commId) {
    if (communityDB.find(commId) == communityDB.end()) return "[]";
    Community& c = communityDB[commId];
    string json = "[";
    int count = 0;
    
    auto addUserToJSON = [&](int uid, bool isBanned) {
        if (userDB.find(uid) != userDB.end()) {
            User& u = userDB[uid];
            bool isMod = c.moderators.count(uid);
            bool isAdmin = c.admins.count(uid);
            if (count > 0) json += ", ";
            json += "{ \"id\": " + to_string(u.id) + ", \"name\": \"" + jsonEscape(u.username) + "\", \"avatar\": \"" + jsonEscape(u.avatarUrl) + "\", \"karma\": " + to_string(u.karma) + 
                    ", \"is_mod\": " + (isMod ? "true" : "false") + 
                    ", \"is_admin\": " + (isAdmin ? "true" : "false") + 
                    ", \"is_banned\": " + (isBanned ? "true" : "false") + " }";
            count++;
        }
    };

    for (int mid : c.members) addUserToJSON(mid, false);
    for (int bid : c.bannedUsers) addUserToJSON(bid, true);

    json += "]";
    return json;
}

string NovaGraph::getUserJSON(int id) {
    if (userDB.find(id) == userDB.end()) return "{}";
    User& u = userDB[id];
    string tagJson = "[";
    for(size_t i=0; i<u.tags.size(); i++) tagJson += "\"" + jsonEscape(u.tags[i]) + "\"" + (i<u.tags.size()-1?",":"");
    tagJson += "]";
    return "{ \"id\": " + to_string(id) + ", \"name\": \"" + jsonEscape(u.username) + "\", \"email\": \"" + jsonEscape(u.email) + "\", \"avatar\": \"" + jsonEscape(u.avatarUrl) + "\", \"karma\": " + to_string(u.karma) + ", \"tags\": " + tagJson + " }";
}

string NovaGraph::getFriendListJSON(int id) {
    string json = "[";
    if (adjList.find(id) != adjList.end()) {
        vector<int> friends = adjList[id];
        sort(friends.begin(), friends.end());
        friends.erase(unique(friends.begin(), friends.end()), friends.end());
        vector<int> validFriends;
        for(int f : friends) if(userDB.find(f) != userDB.end()) validFriends.push_back(f);

        for (size_t i = 0; i < validFriends.size(); ++i) {
            User& f = userDB[validFriends[i]];
            json += "{ \"id\": " + to_string(f.id) + ", \"name\": \"" + jsonEscape(f.username) + "\", \"avatar\": \"" + jsonEscape(f.avatarUrl) + "\", \"karma\": " + to_string(f.karma) + " }";
            if (i < validFriends.size() - 1) json += ", ";
        }
    }
    json += "]";
    return json;
}

string NovaGraph::getAllCommunitiesJSON() {
    string json = "[";
    int count = 0;
    for (auto const& [id, c] : communityDB) {
        if (count > 0) json += ", ";
        json += "{ \"id\": " + to_string(c.id) + ", \"name\": \"" + jsonEscape(c.name) + "\", \"desc\": \"" + jsonEscape(c.description) + "\", \"cover\": \"" + jsonEscape(c.coverUrl) + "\", \"members\": " + to_string(c.members.size()) + ", \"tags\": [";
        for(size_t i=0; i<c.tags.size(); i++) json += "\"" + jsonEscape(c.tags[i]) + "\"" + (i < c.tags.size()-1 ? "," : "");
        json += "] }";
        count++;
    }
    json += "]";
    return json;
}

string NovaGraph::getCommunityDetailsJSON(int commId, int userId, int offset, int limit) {
    if (communityDB.find(commId) == communityDB.end()) return "{}";
    Community& c = communityDB[commId];
    bool isMember = c.members.count(userId);
    bool isMod = c.moderators.count(userId);
    bool isAdmin = c.admins.count(userId);

    string json = "{ \"id\": " + to_string(c.id) + ", \"name\": \"" + jsonEscape(c.name) + "\", \"desc\": \"" + jsonEscape(c.description) + "\", \"is_member\": " + (isMember ? "true" : "false") + ", \"is_mod\": " + (isMod ? "true" : "false") + ", \"is_admin\": " + (isAdmin ? "true" : "false") + ", \"total_msgs\": " + to_string(c.chatHistory.size()) + ", \"messages\": [";
    
    int total = c.chatHistory.size();
    int end = total - offset; 
    int start = max(0, end - limit);
    for(int i = start; i < end; i++) {
        if (i < 0 || i >= total) continue;
        Message& m = c.chatHistory[i];
        bool hasVoted = m.upvoters.count(userId);
        
        string avatar = "";
        if(userDB.find(m.senderId) != userDB.end()) avatar = userDB[m.senderId].avatarUrl;

        json += "{ \"index\": " + to_string(i) + 
                ", \"sender\": \"" + jsonEscape(m.senderName) + "\"" +
                ", \"senderId\": " + to_string(m.senderId) + 
                ", \"senderAvatar\": \"" + jsonEscape(avatar) + "\"" + 
                ", \"content\": \"" + jsonEscape(m.content) + "\"" +
                ", \"time\": \"" + m.timestamp + "\"" +
                ", \"votes\": " + to_string(m.upvoters.size()) + 
                ", \"has_voted\": " + (hasVoted ? "true" : "false") + 
                ", \"pinned\": " + (m.isPinned ? "true" : "false") + " }";
        if(i < end - 1) json += ", ";
    }
    json += "] }";
    return json;
}

string NovaGraph::getConnectionsByDegreeJSON(int startNode, int targetDegree) {
    if (userDB.find(startNode) == userDB.end()) return "[]";
    queue<pair<int, int>> q; q.push({ startNode, 0 }); set<int> visited; visited.insert(startNode);
    vector<int> resultIDs;
    while (!q.empty()) {
        auto [currentUser, depth] = q.front(); q.pop();
        if (depth == targetDegree) { resultIDs.push_back(currentUser); continue; }
        if (depth > targetDegree) continue;
        for (int neighbor : adjList[currentUser]) if (visited.find(neighbor) == visited.end()) { visited.insert(neighbor); q.push({ neighbor, depth + 1 }); }
    }
    string json = "[";
    for (size_t i = 0; i < resultIDs.size(); ++i) {
        User& u = userDB[resultIDs[i]];
        json += "{ \"id\": " + to_string(u.id) + ", \"name\": \"" + jsonEscape(u.username) + "\", \"degree\": " + to_string(targetDegree) + " }";
        if (i < resultIDs.size() - 1) json += ", ";
    }
    json += "]";
    return json;
}

string NovaGraph::getRecommendationsJSON(int userId) {
    if (adjList.find(userId) == adjList.end()) return "[]";
    map<int, int> frequencyMap;
    const vector<int>& myFriends = adjList[userId];
    set<int> existingFriends(myFriends.begin(), myFriends.end()); existingFriends.insert(userId);
    for (int friendId : myFriends) for (int candidate : adjList[friendId]) if (existingFriends.find(candidate) == existingFriends.end()) frequencyMap[candidate]++;
    vector<pair<int, int>> candidates;
    for (auto const& [id, count] : frequencyMap) candidates.push_back({ id, count });
    sort(candidates.begin(), candidates.end(), [](const pair<int, int>& a, const pair<int, int>& b) { return a.second > b.second; });
    string json = "[";
    for (size_t i = 0; i < candidates.size(); ++i) {
        int id = candidates[i].first; string name = userDB[id].username;
        json += "{ \"id\": " + to_string(id) + ", \"name\": \"" + jsonEscape(name) + "\", \"mutual_friends\": " + to_string(candidates[i].second) + " }";
        if (i < candidates.size() - 1) json += ", ";
    }
    json += "]";
    return json;
}

string NovaGraph::getGraphVisualJSON() {
    string json = "{ \"nodes\": [";
    int count = 0;
    for (auto const& [id, user] : userDB) {
        if (count > 0) json += ", ";
        int friendCount = adjList[id].size();
        json += "{ \"id\": " + to_string(id) + ", \"name\": \"" + jsonEscape(user.username) + "\", \"val\": " + to_string(friendCount + 1) + " }";
        count++;
    }
    json += "], \"links\": [";
    count = 0; set<string> processedEdges;
    for (auto const& [u, friends] : adjList) for (int v : friends) {
        int minId = min(u, v); int maxId = max(u, v); string edgeKey = to_string(minId) + "-" + to_string(maxId);
        if (processedEdges.find(edgeKey) == processedEdges.end()) {
            if (count > 0) json += ", ";
            json += "{ \"source\": " + to_string(u) + ", \"target\": " + to_string(v) + " }";
            processedEdges.insert(edgeKey); count++;
        }
    }
    json += "] }";
    return json;
}

int NovaGraph::getRelationDegree(int startNode, int targetNode) {
    if (startNode == targetNode) return 0;
    if (adjList.find(startNode) == adjList.end()) return -1;
    queue<pair<int, int>> q; q.push({ startNode, 0 }); set<int> visited; visited.insert(startNode);
    while (!q.empty()) {
        auto [currentUser, depth] = q.front(); q.pop();
        if (currentUser == targetNode) return depth;
        if (depth >= 3) continue;
        for (int neighbor : adjList[currentUser]) if (visited.find(neighbor) == visited.end()) { visited.insert(neighbor); q.push({ neighbor, depth + 1 }); }
    }
    return -1;
}

string NovaGraph::searchUsersJSON(string query, string tagFilter) {
    string json = "[";
    int count = 0;
    transform(query.begin(), query.end(), query.begin(), ::tolower);
    for (auto const& [id, u] : userDB) {
        string nameLower = u.username;
        transform(nameLower.begin(), nameLower.end(), nameLower.begin(), ::tolower);
        bool nameMatch = query.empty() || (nameLower.find(query) != string::npos);
        bool tagMatch = (tagFilter == "All");
        if (!tagMatch) for (const string& t : u.tags) if (t == tagFilter) { tagMatch = true; break; }
        if (nameMatch && tagMatch) {
            if (count > 0) json += ", ";
            json += "{ \"id\": " + to_string(u.id) + ", \"name\": \"" + jsonEscape(u.username) + "\", \"avatar\": \"" + jsonEscape(u.avatarUrl) + "\", \"karma\": " + to_string(u.karma) + " }";
            count++;
        }
    }
    json += "]";
    return json;
}

string NovaGraph::getPopularCommunitiesJSON() {
    vector<Community> comms;
    for(auto const& [id, c] : communityDB) comms.push_back(c);
    sort(comms.begin(), comms.end(), [](const Community& a, const Community& b) { return a.members.size() > b.members.size(); });
    string json = "[";
    for(size_t i=0; i<comms.size() && i<5; i++) {
        Community& c = comms[i];
        if (i > 0) json += ", ";
        json += "{ \"id\": " + to_string(c.id) + ", \"name\": \"" + jsonEscape(c.name) + "\", \"members\": " + to_string(c.members.size()) + ", \"cover\": \"" + jsonEscape(c.coverUrl) + "\" }";
    }
    json += "]";
    return json;
}

// Updated to include Metadata for Inbox UI (Unread count, Sent/Seen status)
string NovaGraph::getActiveDMsJSON(int userId) {
    string json = "[";
    int count = 0;

    for (auto const& [key, chat] : dmDB) {
        // Parse Key (e.g. "1_2")
        size_t underscore = key.find('_');
        if (underscore == string::npos) continue;
        
        int u = safeStoi(key.substr(0, underscore));
        int v = safeStoi(key.substr(underscore + 1));

        int otherId = -1;
        if (u == userId) otherId = v;
        else if (v == userId) otherId = u;

        if (otherId != -1) {
            // Found a chat involving me
            if (userDB.find(otherId) != userDB.end()) {
                User& other = userDB[otherId];
                
                string lastMsg = "No messages yet";
                string time = "";
                int unreadCount = 0;
                int lastSenderId = -1;
                bool isLastSeen = false;

                if (!chat.messages.empty()) {
                    const auto& last = chat.messages.back();
                    lastMsg = last.content;
                    time = last.timestamp;
                    lastSenderId = last.senderId;
                    isLastSeen = last.isSeen;
                    
                    // Sanitize length for preview
                    if (lastMsg.length() > 30) lastMsg = lastMsg.substr(0, 30) + "...";

                    // Calculate Unread Count (Messages from THEM that are NOT SEEN)
                    for (const auto& m : chat.messages) {
                        if (m.senderId == otherId && !m.isSeen) {
                            unreadCount++;
                        }
                    }
                }

                if (count > 0) json += ", ";
                json += "{ \"id\": " + to_string(other.id) + 
                        ", \"name\": \"" + jsonEscape(other.username) + "\"" +
                        ", \"avatar\": \"" + jsonEscape(other.avatarUrl) + "\"" +
                        ", \"last_msg\": \"" + jsonEscape(lastMsg) + "\"" +
                        ", \"time\": \"" + time + "\"" +
                        ", \"unread\": " + to_string(unreadCount) + 
                        ", \"lastSender\": " + to_string(lastSenderId) + 
                        ", \"lastSeen\": " + (isLastSeen ? "true" : "false") + " }";
                count++;
            }
        }
    }
    json += "]";
    return json;
}

// ==========================================
// DIRECT MESSAGING LOGIC
// ==========================================

void NovaGraph::sendDirectMessage(int senderId, int receiverId, string content, int replyToId) {
    string key = getDMKey(senderId, receiverId);
    
    DirectMessage m;
    m.id = dmDB[key].nextMsgId++; // Auto-increment
    m.senderId = senderId;
    m.content = sanitize(content);
    m.timestamp = getCurrentTime();
    m.replyToMsgId = replyToId; // Store metadata
    m.reaction = "";
    m.isSeen = false;

    dmDB[key].chatKey = key;
    dmDB[key].messages.push_back(m);
    saveData();
}

void NovaGraph::reactToDirectMessage(int senderId, int receiverId, int msgId, string reaction) {
    string key = getDMKey(senderId, receiverId);
    if (dmDB.find(key) != dmDB.end()) {
        for (auto& m : dmDB[key].messages) {
            if (m.id == msgId) {
                m.reaction = reaction;
                saveData();
                return;
            }
        }
    }
}

string NovaGraph::getDirectChatJSON(int viewerId, int friendId) {
    string key = getDMKey(viewerId, friendId);
    
    // 1. MARK SEEN LOGIC
    // If I am viewing the chat, mark all messages from FRIEND as seen
    bool stateChanged = false;
    if (dmDB.find(key) != dmDB.end()) {
        for (auto& m : dmDB[key].messages) {
            if (m.senderId == friendId && !m.isSeen) {
                m.isSeen = true;
                stateChanged = true;
            }
        }
    }
    if (stateChanged) saveData(); // Persist the read receipts

    // 2. GENERATE JSON
    string json = "{ \"friend_id\": " + to_string(friendId) + ", \"messages\": [";
    
    if (dmDB.find(key) != dmDB.end()) {
        const auto& msgs = dmDB[key].messages;
        for (size_t i = 0; i < msgs.size(); ++i) {
            const auto& m = msgs[i];
            
            // Resolve Reply Content (Preview)
            string replyPreview = "";
            if (m.replyToMsgId != -1) {
                // Find original message
                for (const auto& orig : msgs) {
                    if (orig.id == m.replyToMsgId) {
                        replyPreview = sanitize(orig.content.substr(0, 30)); // First 30 chars
                        break;
                    }
                }
            }

            json += "{ \"id\": " + to_string(m.id) + 
                    ", \"senderId\": " + to_string(m.senderId) + 
                    ", \"content\": \"" + m.content + "\"" +
                    ", \"time\": \"" + m.timestamp + "\"" +
                    ", \"replyTo\": " + to_string(m.replyToMsgId) + 
                    ", \"replyPreview\": \"" + replyPreview + "\"" +
                    ", \"reaction\": \"" + m.reaction + "\"" +
                    ", \"isSeen\": " + (m.isSeen ? "true" : "false") + " }";
            
            if (i < msgs.size() - 1) json += ", ";
        }
    }
    json += "] }";
    return json;
}