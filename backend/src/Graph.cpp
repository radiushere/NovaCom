#include "../include/Graph.hpp"
#include "../include/DirectChat.hpp"
#include <fstream>
#include <sstream>
#include <algorithm>
#include <ctime>
#include <queue>
#include <set>
#include <map>

using namespace std;

// ==========================================
// HELPERS
// ==========================================

int safeStoi(string s)
{
    if (s.empty())
        return 0;
    try
    {
        return stoi(s);
    }
    catch (...)
    {
        return 0;
    }
}

string getCurrentTime()
{
    time_t now = time(0);
    tm *ltm = localtime(&now);
    char buffer[20];
    sprintf(buffer, "%02d:%02d", ltm->tm_hour, ltm->tm_min);
    return string(buffer);
}

// Global Split Function (Used by Class and Helpers)
vector<string> globalSplit(const string &s, char delimiter)
{
    vector<string> tokens;
    string token;
    istringstream tokenStream(s);
    while (getline(tokenStream, token, delimiter))
    {
        tokens.push_back(token);
    }
    return tokens;
}

string getDMKey(int u, int v)
{
    if (u < v)
        return to_string(u) + "_" + to_string(v);
    return to_string(v) + "_" + to_string(u);
}

string jsonEscape(const string &s)
{
    string output;
    for (char c : s)
    {
        if (c == '"')
            output += "\\\"";
        else if (c == '\\')
            output += "\\\\";
        else if (c == '\b')
            output += "\\b";
        else if (c == '\f')
            output += "\\f";
        else if (c == '\n')
            output += "\\n";
        else if (c == '\r')
            output += "\\r";
        else if (c == '\t')
            output += "\\t";
        else
            output += c;
    }
    return output;
}

string sanitize(string input)
{
    replace(input.begin(), input.end(), '\n', ' '); // Remove Newlines
    replace(input.begin(), input.end(), '\r', ' '); // Remove Carriage Returns
    replace(input.begin(), input.end(), '|', ' ');  // Remove Pipes
    return input;
}

// --- Poll Parsers (Now using globalSplit) ---
string serializePoll(const PollData &p)
{
    string s = sanitize(p.question) + "|" + (p.allowMultiple ? "1" : "0") + "|";
    for (size_t i = 0; i < p.options.size(); i++)
    {
        const auto &opt = p.options[i];
        s += to_string(opt.id) + "~" + sanitize(opt.text) + "~";
        if (opt.voterIds.empty())
            s += "0";
        else
        {
            int c = 0;
            for (int vid : opt.voterIds)
            {
                s += to_string(vid) + (c < opt.voterIds.size() - 1 ? "," : "");
                c++;
            }
        }
        if (i < p.options.size() - 1)
            s += "^";
    }
    return s;
}

PollData parsePoll(string s)
{
    PollData p;
    auto parts = globalSplit(s, '|');
    if (parts.size() < 3)
        return p;

    p.question = parts[0];
    p.allowMultiple = (parts[1] == "1");

    auto opts = globalSplit(parts[2], '^');
    for (auto &oStr : opts)
    {
        auto fields = globalSplit(oStr, '~');
        if (fields.size() >= 3)
        {
            PollOption opt;
            opt.id = safeStoi(fields[0]);
            opt.text = fields[1];
            if (fields[2] != "0")
            {
                auto vList = globalSplit(fields[2], ',');
                for (auto v : vList)
                    opt.voterIds.insert(safeStoi(v));
            }
            p.options.push_back(opt);
        }
    }
    return p;
}

// ==========================================
// PERSISTENCE (Merged Logic)
// ==========================================

// Bridge function for Class to use Global Split
vector<string> NovaGraph::split(const string &s, char delimiter)
{
    return globalSplit(s, delimiter);
}

void NovaGraph::loadData()
{
    string line;

    // 1. Users
    ifstream userFile("data/users.txt");
    if (userFile.is_open())
    {
        while (getline(userFile, line))
        {
            auto parts = split(line, '|');
            if (parts.size() >= 7)
            {
                User u;
                u.id = safeStoi(parts[0]);
                u.username = parts[1];
                u.email = parts[2];
                u.password = parts[3];
                u.avatarUrl = parts[4];
                u.tags = split(parts[5], ',');
                u.karma = safeStoi(parts[6]);
                if (parts.size() > 7 && parts[7] != "0" && parts[7] != "")
                {
                    auto reqList = split(parts[7], ',');
                    for (auto r : reqList)
                    {
                        int rid = safeStoi(r);
                        if (rid != 0)
                            u.pendingRequests.insert(rid);
                    }
                }
                if (u.id != 0)
                {
                    userDB[u.id] = u;
                    usernameIndex[u.username] = u.id;
                }
            }
        }
        userFile.close();
    }

    // 2. Graph
    ifstream graphFile("data/graph.txt");
    if (graphFile.is_open())
    {
        while (getline(graphFile, line))
        {
            auto parts = split(line, ',');
            int id = safeStoi(parts[0]);
            vector<int> friends;
            for (size_t i = 1; i < parts.size(); i++)
            {
                int fid = safeStoi(parts[i]);
                if (fid != id && fid != 0)
                    friends.push_back(fid);
            }
            sort(friends.begin(), friends.end());
            friends.erase(unique(friends.begin(), friends.end()), friends.end());
            adjList[id] = friends;
        }
        graphFile.close();
    }

    // 3. Communities
    ifstream commFile("data/communities.txt");
    if (commFile.is_open())
    {
        while (getline(commFile, line))
        {
            auto parts = split(line, '|');
            if (parts.size() >= 5)
            {
                Community c;
                c.id = safeStoi(parts[0]);
                c.name = parts[1];
                c.description = parts[2];
                c.coverUrl = parts[3];
                auto tagList = split(parts[4], ',');
                for (auto t : tagList)
                    if (!t.empty())
                        c.tags.push_back(t);
                if (parts.size() > 5 && parts[5] != "NULL")
                {
                    auto memList = split(parts[5], ',');
                    for (auto m : memList)
                    {
                        int mid = safeStoi(m);
                        if (mid != 0)
                            c.members.insert(mid);
                    }
                }
                if (parts.size() > 6 && parts[6] != "NULL")
                {
                    auto modList = split(parts[6], ',');
                    for (auto m : modList)
                    {
                        int mid = safeStoi(m);
                        if (mid != 0)
                            c.moderators.insert(mid);
                    }
                }
                if (parts.size() > 7 && parts[7] != "NULL")
                {
                    auto banList = split(parts[7], ',');
                    for (auto b : banList)
                    {
                        int bid = safeStoi(b);
                        if (bid != 0)
                            c.bannedUsers.insert(bid);
                    }
                }
                if (parts.size() > 8 && parts[8] != "NULL")
                {
                    auto adminList = split(parts[8], ',');
                    for (auto a : adminList)
                    {
                        int aid = safeStoi(a);
                        if (aid != 0)
                            c.admins.insert(aid);
                    }
                }
                if (c.id != 0)
                {
                    communityDB[c.id] = c;
                    if (c.id >= nextCommunityId)
                        nextCommunityId = c.id + 1;
                }
            }
        }
        commFile.close();
    }

    // 4. Chats
    ifstream chatFile("data/chats.txt");
    if (chatFile.is_open())
    {
        while (getline(chatFile, line))
        {
            auto parts = split(line, '|');

            // Check for format version (Old=9/10 fields, New=11 fields)
            // We'll use a flexible approach
            if (parts.size() >= 10)
            {
                int commId = safeStoi(parts[0]);
                if (communityDB.find(commId) != communityDB.end())
                {
                    Message m;
                    m.id = safeStoi(parts[1]);
                    m.senderId = safeStoi(parts[2]);
                    m.senderName = parts[3];
                    m.timestamp = parts[4];
                    m.upvoters.clear();
                    if (parts[5] != "0" && parts[5] != "")
                    {
                        auto voterList = split(parts[5], ',');
                        for (auto v : voterList)
                        {
                            int vid = safeStoi(v);
                            if (vid != 0)
                                m.upvoters.insert(vid);
                        }
                    }
                    m.isPinned = (parts[6] == "1");
                    m.replyToId = safeStoi(parts[7]);
                    m.type = parts[8];

                    int contentIdx = 9;

                    // IF NEW FORMAT (Has MediaUrl at index 9)
                    if (parts.size() >= 11)
                    {
                        m.mediaUrl = parts[9];
                        contentIdx = 10;
                    }
                    else
                    {
                        m.mediaUrl = ""; // Legacy
                    }

                    // Content is the rest
                    string rawContent = parts[contentIdx];
                    for (size_t i = contentIdx + 1; i < parts.size(); i++)
                        rawContent += "|" + parts[i];

                    if (m.type == "poll")
                    {
                        m.poll = parsePoll(rawContent);
                        m.content = "Poll: " + m.poll.question;
                    }
                    else
                    {
                        m.content = rawContent;
                    }

                    communityDB[commId].chatHistory.push_back(m);
                    if (m.id >= communityDB[commId].nextMsgId)
                        communityDB[commId].nextMsgId = m.id + 1;
                }
            }
        }
        chatFile.close();
    }

    // 5. DMs
    ifstream dmFile("data/dms.txt");
    if (dmFile.is_open())
    {
        string line;
        while (getline(dmFile, line))
        {
            auto parts = split(line, '|');

            // Check for Legacy Format (Size 8) vs New Format (Size 10)
            if (parts.size() >= 8)
            {
                string key = parts[0];
                DirectMessage m;
                m.id = safeStoi(parts[1]);
                m.senderId = safeStoi(parts[2]);
                m.timestamp = parts[3];
                m.replyToMsgId = safeStoi(parts[4]);
                m.reaction = (parts[5] == "NONE") ? "" : parts[5];
                m.isSeen = (parts[6] == "1");

                int contentIdx = 7; // Default for legacy

                // NEW FORMAT HANDLING
                if (parts.size() >= 10)
                {
                    m.type = parts[7];
                    m.mediaUrl = parts[8];
                    contentIdx = 9;
                }
                else
                {
                    // Default values for old messages
                    m.type = "text";
                    m.mediaUrl = "";
                }

                m.content = parts[contentIdx];
                // Reassemble content if pipes existed
                for (size_t i = contentIdx + 1; i < parts.size(); i++)
                    m.content += " " + parts[i];

                dmDB[key].chatKey = key;
                dmDB[key].messages.push_back(m);
                if (m.id >= dmDB[key].nextMsgId)
                    dmDB[key].nextMsgId = m.id + 1;
            }
        }
        dmFile.close();
    }
}

void NovaGraph::saveData()
{
    // 1. Save Users (Preserving Pending Requests)
    ofstream userFile("data/users.txt");
    for (auto const &[id, u] : userDB)
    {
        string tagStr = "";
        for (size_t i = 0; i < u.tags.size(); i++)
            tagStr += u.tags[i] + (i < u.tags.size() - 1 ? "," : "");
        if (tagStr.empty())
            tagStr = "None";
        userFile << u.id << "|" << u.username << "|" << u.email << "|" << u.password << "|" << (u.avatarUrl.empty() ? "NULL" : u.avatarUrl) << "|" << tagStr << "|" << u.karma << "|";
        if (u.pendingRequests.empty())
            userFile << "0";
        else
        {
            int i = 0;
            for (int rid : u.pendingRequests)
            {
                userFile << rid << (i < u.pendingRequests.size() - 1 ? "," : "");
                i++;
            }
        }
        userFile << "\n";
    }
    userFile.close();

    // 2. Save Graph
    ofstream graphFile("data/graph.txt");
    for (auto &[id, friends] : adjList)
    {
        sort(friends.begin(), friends.end());
        friends.erase(unique(friends.begin(), friends.end()), friends.end());
        graphFile << id;
        for (int friendID : friends)
            graphFile << "," << friendID;
        graphFile << "\n";
    }
    graphFile.close();

    // 3. Save Communities (With Admins)
    ofstream commFile("data/communities.txt");
    for (auto const &[id, c] : communityDB)
    {
        commFile << c.id << "|" << c.name << "|" << c.description << "|" << (c.coverUrl.empty() ? "NULL" : c.coverUrl) << "|";
        for (size_t i = 0; i < c.tags.size(); i++)
            commFile << c.tags[i] << (i < c.tags.size() - 1 ? "," : "");
        commFile << "|";
        if (c.members.empty())
            commFile << "NULL";
        else
        {
            int i = 0;
            for (int m : c.members)
            {
                commFile << m << (i < c.members.size() - 1 ? "," : "");
                i++;
            }
        }
        commFile << "|";
        if (c.moderators.empty())
            commFile << "NULL";
        else
        {
            int i = 0;
            for (int m : c.moderators)
            {
                commFile << m << (i < c.moderators.size() - 1 ? "," : "");
                i++;
            }
        }
        commFile << "|";
        if (c.bannedUsers.empty())
            commFile << "NULL";
        else
        {
            int i = 0;
            for (int m : c.bannedUsers)
            {
                commFile << m << (i < c.bannedUsers.size() - 1 ? "," : "");
                i++;
            }
        }
        commFile << "|";
        if (c.admins.empty())
            commFile << "NULL";
        else
        {
            int i = 0;
            for (int a : c.admins)
            {
                commFile << a << (i < c.admins.size() - 1 ? "," : "");
                i++;
            }
        }
        commFile << "\n";
    }
    commFile.close();

    // 4. Save Chats (Updated format with Type and ReplyID)
    ofstream chatFile("data/chats.txt");
    for (auto const &[commId, comm] : communityDB)
    {
        for (const auto &msg : comm.chatHistory)
        {
            chatFile << commId << "|"
                     << msg.id << "|"
                     << msg.senderId << "|"
                     << msg.senderName << "|"
                     << msg.timestamp << "|";

            if (msg.upvoters.empty())
                chatFile << "0";
            else
            {
                int i = 0;
                for (int uid : msg.upvoters)
                {
                    chatFile << uid << (i < msg.upvoters.size() - 1 ? "," : "");
                    i++;
                }
            }

            chatFile << "|"
                     << (msg.isPinned ? "1" : "0") << "|"
                     << msg.replyToId << "|"
                     << msg.type << "|"
                     // NEW FIELD: MediaUrl
                     << (msg.mediaUrl.empty() ? "NONE" : sanitize(msg.mediaUrl)) << "|";

            if (msg.type == "poll")
                chatFile << serializePoll(msg.poll);
            else
                chatFile << sanitize(msg.content);

            chatFile << "\n";
        }
    }
    chatFile.close();

    // 5. Save DMs
    ofstream dmOut("data/dms.txt");
    for (auto const &[key, chat] : dmDB)
    {
        for (const auto &m : chat.messages)
        {
            dmOut << key << "|"
                  << m.id << "|"
                  << m.senderId << "|"
                  << m.timestamp << "|"
                  << m.replyToMsgId << "|"
                  << (m.reaction.empty() ? "NONE" : m.reaction) << "|"
                  << (m.isSeen ? "1" : "0") << "|"
                  << m.type << "|"
                  // FIX: Sanitize mediaUrl to remove newlines
                  << (m.mediaUrl.empty() ? "NONE" : sanitize(m.mediaUrl)) << "|"
                  << sanitize(m.content) << "\n";
        }
    }
    dmOut.close();
}

// ==========================================
// CONNECTION LOGIC (INVITE SYSTEM)
// ==========================================

string NovaGraph::sendConnectionRequest(int senderId, int targetId)
{
    if (userDB.find(targetId) == userDB.end())
        return "error_user_not_found";
    if (senderId == targetId)
        return "error_self";
    vector<int> &friends = adjList[senderId];
    if (find(friends.begin(), friends.end(), targetId) != friends.end())
        return "already_friends";
    User &target = userDB[targetId];
    if (target.pendingRequests.count(senderId))
        return "request_pending";
    target.pendingRequests.insert(senderId);
    saveData();
    return "request_sent";
}

void NovaGraph::acceptConnectionRequest(int userId, int requesterId)
{
    if (userDB.find(userId) == userDB.end() || userDB.find(requesterId) == userDB.end())
        return;
    User &me = userDB[userId];
    if (me.pendingRequests.count(requesterId))
    {
        me.pendingRequests.erase(requesterId);
        addFriendship(userId, requesterId);
        saveData();
    }
}

void NovaGraph::declineConnectionRequest(int userId, int requesterId)
{
    if (userDB.find(userId) == userDB.end())
        return;
    User &me = userDB[userId];
    if (me.pendingRequests.count(requesterId))
    {
        me.pendingRequests.erase(requesterId);
        saveData();
    }
}

string NovaGraph::getPendingRequestsJSON(int userId)
{
    if (userDB.find(userId) == userDB.end())
        return "[]";
    User &me = userDB[userId];
    string json = "[";
    int count = 0;
    for (int rid : me.pendingRequests)
    {
        if (userDB.find(rid) != userDB.end())
        {
            User &r = userDB[rid];
            if (count > 0)
                json += ", ";
            json += "{ \"id\": " + to_string(r.id) + ", \"name\": \"" + jsonEscape(r.username) + "\", \"avatar\": \"" + jsonEscape(r.avatarUrl) + "\", \"karma\": " + to_string(r.karma) + " }";
            count++;
        }
    }
    json += "]";
    return json;
}

string NovaGraph::getRelationshipStatus(int me, int target)
{
    if (me == target)
        return "self";
    vector<int> &friends = adjList[me];
    if (find(friends.begin(), friends.end(), target) != friends.end())
        return "friend";
    if (userDB[target].pendingRequests.count(me))
        return "pending_sent";
    if (userDB[me].pendingRequests.count(target))
        return "pending_received";
    return "none";
}

// ==========================================
// CORE LOGIC & DMs
// ==========================================

void NovaGraph::sendDirectMessage(int senderId, int receiverId, string content, int replyToId, string type, string mediaUrl)
{
    string key = getDMKey(senderId, receiverId);

    DirectMessage m;
    m.id = dmDB[key].nextMsgId++;
    m.senderId = senderId;
    m.content = sanitize(content);
    m.timestamp = getCurrentTime();
    m.replyToMsgId = replyToId;
    m.reaction = "";
    m.isSeen = false;
    m.type = type;
    // FIX: Sanitize incoming mediaUrl immediately
    m.mediaUrl = (mediaUrl.empty() ? "NONE" : sanitize(mediaUrl));

    dmDB[key].chatKey = key;
    dmDB[key].messages.push_back(m);
    saveData();
}

void NovaGraph::reactToDirectMessage(int senderId, int receiverId, int msgId, string reaction)
{
    string key = getDMKey(senderId, receiverId);
    if (dmDB.find(key) != dmDB.end())
    {
        for (auto &m : dmDB[key].messages)
        {
            if (m.id == msgId)
            {
                m.reaction = reaction;
                saveData();
                return;
            }
        }
    }
}

string NovaGraph::getDirectChatJSON(int viewerId, int friendId, int offset, int limit)
{
    string key = getDMKey(viewerId, friendId);

    // Mark Seen
    bool stateChanged = false;
    if (dmDB.find(key) != dmDB.end())
    {
        for (auto &m : dmDB[key].messages)
        {
            if (m.senderId == friendId && !m.isSeen)
            {
                m.isSeen = true;
                stateChanged = true;
            }
        }
    }
    if (stateChanged)
        saveData();

    if (dmDB.find(key) == dmDB.end())
    {
        return "{ \"friend_id\": " + to_string(friendId) + ", \"total_msgs\": 0, \"messages\": [] }";
    }

    const auto &allMsgs = dmDB[key].messages;
    int total = allMsgs.size();
    int end = total - offset;
    int start = max(0, end - limit);

    string json = "{ \"friend_id\": " + to_string(friendId) +
                  ", \"total_msgs\": " + to_string(total) +
                  ", \"messages\": [";

    for (int i = start; i < end; i++)
    {
        if (i < 0 || i >= total)
            continue;
        const auto &m = allMsgs[i];

        string replyPreview = "";
        if (m.replyToMsgId != -1)
        {
            for (const auto &orig : allMsgs)
            {
                if (orig.id == m.replyToMsgId)
                {
                    // Preview content: if image, say [Image], else text
                    string previewText = (orig.type == "image") ? "[Image]" : orig.content;
                    replyPreview = sanitize(previewText.substr(0, 30));
                    break;
                }
            }
        }

        json += "{ \"id\": " + to_string(m.id) +
                ", \"senderId\": " + to_string(m.senderId) +
                ", \"content\": \"" + jsonEscape(m.content) + "\"" +
                ", \"time\": \"" + m.timestamp + "\"" +
                ", \"replyTo\": " + to_string(m.replyToMsgId) +
                ", \"replyPreview\": \"" + jsonEscape(replyPreview) + "\"" +
                ", \"reaction\": \"" + m.reaction + "\"" +
                ", \"isSeen\": " + (m.isSeen ? "true" : "false") +
                ", \"type\": \"" + m.type + "\"" +
                ", \"mediaUrl\": \"" + jsonEscape(m.mediaUrl) + "\" }";

        if (i < end - 1)
            json += ", ";
    }
    json += "] }";
    return json;
}

void NovaGraph::deleteDirectMessage(int userId, int friendId, int msgId)
{
    string key = getDMKey(userId, friendId);

    if (dmDB.find(key) != dmDB.end())
    {
        auto &msgs = dmDB[key].messages;
        for (auto it = msgs.begin(); it != msgs.end(); ++it)
        {
            if (it->id == msgId)
            {
                // Security Check: Only the sender can delete their own message
                if (it->senderId == userId)
                {
                    msgs.erase(it);
                    saveData(); // Persist changes
                }
                return; // Stop after finding/deleting
            }
        }
    }
}

string NovaGraph::getActiveDMsJSON(int userId)
{
    string json = "[";
    int count = 0;
    for (auto const &[key, chat] : dmDB)
    {
        size_t underscore = key.find('_');
        if (underscore == string::npos)
            continue;
        int u = safeStoi(key.substr(0, underscore));
        int v = safeStoi(key.substr(underscore + 1));
        int otherId = (u == userId) ? v : (v == userId ? u : -1);
        if (otherId != -1 && userDB.find(otherId) != userDB.end())
        {
            User &other = userDB[otherId];
            string lastMsg = "No messages";
            string time = "";
            int unreadCount = 0;
            int lastSenderId = -1;
            bool isLastSeen = false;
            if (!chat.messages.empty())
            {
                const auto &last = chat.messages.back();
                lastMsg = last.content;
                time = last.timestamp;
                lastSenderId = last.senderId;
                isLastSeen = last.isSeen;
                if (lastMsg.length() > 30)
                    lastMsg = lastMsg.substr(0, 30) + "...";
                for (const auto &m : chat.messages)
                    if (m.senderId == otherId && !m.isSeen)
                        unreadCount++;
            }
            if (count > 0)
                json += ", ";
            json += "{ \"id\": " + to_string(other.id) + ", \"name\": \"" + jsonEscape(other.username) + "\", \"avatar\": \"" + jsonEscape(other.avatarUrl) + "\", \"last_msg\": \"" + jsonEscape(lastMsg) + "\", \"time\": \"" + time + "\", \"unread\": " + to_string(unreadCount) + ", \"lastSender\": " + to_string(lastSenderId) + ", \"lastSeen\": " + (isLastSeen ? "true" : "false") + " }";
            count++;
        }
    }
    json += "]";
    return json;
}

void NovaGraph::removeFriendship(int u, int v)
{
    // Remove v from u's list
    if (adjList.find(u) != adjList.end())
    {
        auto &friends = adjList[u];
        friends.erase(remove(friends.begin(), friends.end(), v), friends.end());
    }
    // Remove u from v's list
    if (adjList.find(v) != adjList.end())
    {
        auto &friends = adjList[v];
        friends.erase(remove(friends.begin(), friends.end(), u), friends.end());
    }
    saveData();
}

// ==========================================
// USER & GRAPH LOGIC
// ==========================================

int NovaGraph::registerUser(string username, string email, string password, string avatar, string tags)
{
    if (usernameIndex.find(username) != usernameIndex.end())
        return -1;
    int newId = 1;
    if (!userDB.empty())
    {
        int maxId = 0;
        for (auto const &[id, u] : userDB)
            if (id > maxId)
                maxId = id;
        newId = maxId + 1;
    }
    User u;
    u.id = newId;
    u.username = username;
    u.email = email;
    u.password = password;
    u.avatarUrl = avatar;
    u.tags = split(tags, ',');
    u.karma = 0;
    userDB[newId] = u;
    usernameIndex[username] = newId;
    saveData();
    return newId;
}

int NovaGraph::loginUser(string username, string password)
{
    if (usernameIndex.find(username) == usernameIndex.end())
        return -1;
    int id = usernameIndex[username];
    if (userDB[id].password == password)
        return id;
    return -1;
}

void NovaGraph::updateUserProfile(int id, string email, string avatar, string tags)
{
    if (userDB.find(id) != userDB.end())
    {
        userDB[id].email = email;
        userDB[id].avatarUrl = avatar;
        userDB[id].tags = split(tags, ',');
        saveData();
    }
}

void NovaGraph::addUser(int id, string username)
{
    if (userDB.find(id) != userDB.end())
        return;
    User u;
    u.id = id;
    u.username = username;
    u.karma = 0;
    userDB[id] = u;
}

void NovaGraph::deleteUser(int id)
{
    if (userDB.find(id) == userDB.end())
        return;
    string username = userDB[id].username;
    usernameIndex.erase(username);
    userDB.erase(id);
    adjList.erase(id);
    for (auto &[otherId, friends] : adjList)
    {
        auto it = remove(friends.begin(), friends.end(), id);
        if (it != friends.end())
            friends.erase(it, friends.end());
    }
    for (auto &[commId, c] : communityDB)
    {
        c.members.erase(id);
        c.moderators.erase(id);
        c.admins.erase(id);
        c.bannedUsers.erase(id);
    }
    saveData();
}

void NovaGraph::addFriendship(int u, int v)
{
    if (u == v)
        return;
    auto &uFriends = adjList[u];
    if (find(uFriends.begin(), uFriends.end(), v) != uFriends.end())
        return;
    adjList[u].push_back(v);
    adjList[v].push_back(u);
}

void NovaGraph::createCommunity(string name, string desc, string tags, int creatorId, string coverUrl)
{
    Community c;
    c.id = nextCommunityId++;
    c.name = name;
    c.description = desc;
    c.coverUrl = coverUrl;
    c.tags = split(tags, ',');
    c.members.insert(creatorId);
    c.moderators.insert(creatorId);
    communityDB[c.id] = c;
}

void NovaGraph::joinCommunity(int userId, int commId)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        if (c.bannedUsers.count(userId))
            return;
        c.members.insert(userId);
        if (c.moderators.empty())
            c.moderators.insert(userId);
    }
}

void NovaGraph::leaveCommunity(int userId, int commId)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        c.members.erase(userId);
        if (c.admins.count(userId))
            c.admins.erase(userId);
        if (c.moderators.count(userId))
        {
            c.moderators.erase(userId);
            if (c.moderators.empty() && !c.members.empty())
                c.moderators.insert(*c.members.begin());
        }
    }
}

// UPDATED addMessage (With Type and ReplyID)
void NovaGraph::addMessage(int commId, int senderId, string content, string type, string mediaUrl, int replyToId)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        if (communityDB[commId].members.count(senderId))
        {
            Community &c = communityDB[commId];
            Message m;
            m.id = c.nextMsgId++;
            m.senderId = senderId;
            m.senderName = userDB[senderId].username;
            m.content = sanitize(content);
            m.timestamp = getCurrentTime();
            m.upvoters.clear();
            m.isPinned = false;
            m.type = type;
            m.mediaUrl = (mediaUrl.empty() ? "NONE" : sanitize(mediaUrl));
            m.replyToId = replyToId;

            c.chatHistory.push_back(m);
            saveData();
        }
    }
}

// NEW: Vote Poll
void NovaGraph::votePoll(int commId, int userId, int msgIndex, int optionIndex)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        if (msgIndex >= 0 && msgIndex < c.chatHistory.size())
        {
            Message &m = c.chatHistory[msgIndex];
            if (m.type != "POLL")
                return;
            size_t pipePos = m.content.find('|');
            if (pipePos == string::npos)
                return;
            string q = m.content.substr(0, pipePos);
            auto opts = split(m.content.substr(pipePos + 1), ',');
            if (optionIndex >= 0 && optionIndex < opts.size())
            {
                string opt = opts[optionIndex];
                size_t colon = opt.rfind(':');
                if (colon != string::npos)
                {
                    int count = safeStoi(opt.substr(colon + 1)) + 1;
                    opts[optionIndex] = opt.substr(0, colon) + ":" + to_string(count);
                }
            }
            string newC = q + "|";
            for (size_t i = 0; i < opts.size(); i++)
                newC += opts[i] + (i < opts.size() - 1 ? "," : "");
            m.content = newC;
            saveData();
        }
    }
}

// ==========================================
// MODERATION & ADMIN
// ==========================================

void NovaGraph::promoteToAdmin(int commId, int actorId, int targetId)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        if (c.moderators.count(actorId))
        {
            c.admins.insert(targetId);
            saveData();
        }
    }
}

void NovaGraph::demoteAdmin(int commId, int actorId, int targetId)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        if (c.moderators.count(actorId))
        {
            c.admins.erase(targetId);
            saveData();
        }
    }
}

void NovaGraph::transferOwnership(int commId, int actorId, int targetId)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        if (c.moderators.count(actorId))
        {
            c.moderators.erase(actorId);
            c.moderators.insert(targetId);
            c.admins.erase(targetId);
            saveData();
        }
    }
}

void NovaGraph::banUser(int commId, int actorId, int targetId)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        bool isMod = c.moderators.count(actorId);
        bool isAdmin = c.admins.count(actorId);
        if (c.moderators.count(targetId))
            return;

        if (isMod)
        {
            c.members.erase(targetId);
            c.admins.erase(targetId);
            c.bannedUsers.insert(targetId);
            saveData();
        }
        else if (isAdmin)
        {
            if (!c.admins.count(targetId))
            {
                c.members.erase(targetId);
                c.bannedUsers.insert(targetId);
                saveData();
            }
        }
    }
}

void NovaGraph::unbanUser(int commId, int adminId, int targetId)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        bool isMod = c.moderators.count(adminId);
        bool isAdmin = c.admins.count(adminId);
        if (isMod || isAdmin)
        {
            c.bannedUsers.erase(targetId);
            saveData();
        }
    }
}

void NovaGraph::deleteMessage(int commId, int adminId, int msgIndex)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        bool isMod = c.moderators.count(adminId);
        bool isAdmin = c.admins.count(adminId);
        if ((isMod || isAdmin) && msgIndex >= 0 && msgIndex < c.chatHistory.size())
        {
            c.chatHistory.erase(c.chatHistory.begin() + msgIndex);
            saveData();
        }
    }
}

void NovaGraph::pinMessage(int commId, int adminId, int msgIndex)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        bool isMod = c.moderators.count(adminId);
        bool isAdmin = c.admins.count(adminId);
        if ((isMod || isAdmin) && msgIndex >= 0 && msgIndex < c.chatHistory.size())
        {
            Message &targetMsg = c.chatHistory[msgIndex];
            if (!targetMsg.isPinned)
            {
                int pinCount = 0;
                int firstPinIndex = -1;
                for (int i = 0; i < c.chatHistory.size(); i++)
                {
                    if (c.chatHistory[i].isPinned)
                    {
                        pinCount++;
                        if (firstPinIndex == -1)
                            firstPinIndex = i;
                    }
                }
                if (pinCount >= 2 && firstPinIndex != -1)
                    c.chatHistory[firstPinIndex].isPinned = false;
                targetMsg.isPinned = true;
            }
            else
            {
                targetMsg.isPinned = false;
            }
            saveData();
        }
    }
}

void NovaGraph::upvoteMessage(int commId, int userId, int msgIndex)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        Community &c = communityDB[commId];
        if (msgIndex >= 0 && msgIndex < c.chatHistory.size())
        {
            Message &m = c.chatHistory[msgIndex];
            if (m.upvoters.count(userId))
                m.upvoters.erase(userId);
            else
            {
                m.upvoters.insert(userId);
                if (userDB.find(m.senderId) != userDB.end())
                    userDB[m.senderId].karma += 5;
            }
            saveData();
        }
    }
}

// ==========================================
// POLL LOGIC
// ==========================================

void NovaGraph::createPoll(int commId, int senderId, string question, bool allowMultiple, vector<string> options)
{
    if (communityDB.find(commId) != communityDB.end())
    {
        if (communityDB[commId].members.count(senderId))
        {
            Community &c = communityDB[commId];
            Message m;
            m.id = c.nextMsgId++;
            m.senderId = senderId;
            m.senderName = userDB[senderId].username;
            m.timestamp = getCurrentTime();
            m.type = "poll";
            m.content = "Poll: " + question;
            m.poll.question = question;
            m.poll.allowMultiple = allowMultiple;
            int optId = 1;
            for (const string &txt : options)
            {
                PollOption o;
                o.id = optId++;
                o.text = txt;
                m.poll.options.push_back(o);
            }
            c.chatHistory.push_back(m);
            saveData();
        }
    }
}

void NovaGraph::togglePollVote(int commId, int userId, int msgId, int optionId)
{
    if (communityDB.find(commId) == communityDB.end())
        return;
    Community &c = communityDB[commId];
    for (auto &m : c.chatHistory)
    {
        if (m.id == msgId && m.type == "poll")
        {
            bool alreadyVotedThis = false;
            for (auto &opt : m.poll.options)
                if (opt.id == optionId && opt.voterIds.count(userId))
                {
                    alreadyVotedThis = true;
                    break;
                }
            if (alreadyVotedThis)
            {
                for (auto &opt : m.poll.options)
                    if (opt.id == optionId)
                        opt.voterIds.erase(userId);
            }
            else
            {
                if (!m.poll.allowMultiple)
                    for (auto &opt : m.poll.options)
                        opt.voterIds.erase(userId);
                for (auto &opt : m.poll.options)
                    if (opt.id == optionId)
                        opt.voterIds.insert(userId);
            }
            saveData();
            return;
        }
    }
}

// ==========================================
// JSON RESPONSES
// ==========================================

string NovaGraph::getCommunityMembersJSON(int commId)
{
    if (communityDB.find(commId) == communityDB.end())
        return "[]";
    Community &c = communityDB[commId];
    string json = "[";
    int count = 0;

    auto addUserToJSON = [&](int uid, bool isBanned)
    {
        if (userDB.find(uid) != userDB.end())
        {
            User &u = userDB[uid];
            bool isMod = c.moderators.count(uid);
            bool isAdmin = c.admins.count(uid);
            if (count > 0)
                json += ", ";
            json += "{ \"id\": " + to_string(u.id) + ", \"name\": \"" + jsonEscape(u.username) + "\", \"avatar\": \"" + jsonEscape(u.avatarUrl) + "\", \"karma\": " + to_string(u.karma) +
                    ", \"is_mod\": " + (isMod ? "true" : "false") +
                    ", \"is_admin\": " + (isAdmin ? "true" : "false") +
                    ", \"is_banned\": " + (isBanned ? "true" : "false") + " }";
            count++;
        }
    };

    for (int mid : c.members)
        addUserToJSON(mid, false);
    for (int bid : c.bannedUsers)
        addUserToJSON(bid, true);

    json += "]";
    return json;
}

string NovaGraph::getUserJSON(int id)
{
    if (userDB.find(id) == userDB.end())
        return "{}";
    User &u = userDB[id];
    string tagJson = "[";
    for (size_t i = 0; i < u.tags.size(); i++)
        tagJson += "\"" + jsonEscape(u.tags[i]) + "\"" + (i < u.tags.size() - 1 ? "," : "");
    tagJson += "]";
    return "{ \"id\": " + to_string(id) + ", \"name\": \"" + jsonEscape(u.username) + "\", \"email\": \"" + jsonEscape(u.email) + "\", \"avatar\": \"" + jsonEscape(u.avatarUrl) + "\", \"karma\": " + to_string(u.karma) + ", \"tags\": " + tagJson + " }";
}

string NovaGraph::getFriendListJSON(int id)
{
    string json = "[";
    if (adjList.find(id) != adjList.end())
    {
        vector<int> friends = adjList[id];
        sort(friends.begin(), friends.end());
        friends.erase(unique(friends.begin(), friends.end()), friends.end());
        vector<int> validFriends;
        for (int f : friends)
            if (userDB.find(f) != userDB.end())
                validFriends.push_back(f);

        for (size_t i = 0; i < validFriends.size(); ++i)
        {
            User &f = userDB[validFriends[i]];
            json += "{ \"id\": " + to_string(f.id) + ", \"name\": \"" + jsonEscape(f.username) + "\", \"avatar\": \"" + jsonEscape(f.avatarUrl) + "\", \"karma\": " + to_string(f.karma) + " }";
            if (i < validFriends.size() - 1)
                json += ", ";
        }
    }
    json += "]";
    return json;
}

string NovaGraph::getAllCommunitiesJSON()
{
    string json = "[";
    int count = 0;
    for (auto const &[id, c] : communityDB)
    {
        if (count > 0)
            json += ", ";
        json += "{ \"id\": " + to_string(c.id) + ", \"name\": \"" + jsonEscape(c.name) + "\", \"desc\": \"" + jsonEscape(c.description) + "\", \"cover\": \"" + jsonEscape(c.coverUrl) + "\", \"members\": " + to_string(c.members.size()) + ", \"tags\": [";
        for (size_t i = 0; i < c.tags.size(); i++)
            json += "\"" + jsonEscape(c.tags[i]) + "\"" + (i < c.tags.size() - 1 ? "," : "");
        json += "] }";
        count++;
    }
    json += "]";
    return json;
}

// UPDATED getCommunityDetailsJSON (With Types and Replies)
string NovaGraph::getCommunityDetailsJSON(int commId, int userId, int offset, int limit)
{
    if (communityDB.find(commId) == communityDB.end())
        return "{}";
    Community &c = communityDB[commId];
    bool isMember = c.members.count(userId);
    bool isMod = c.moderators.count(userId);
    bool isAdmin = c.admins.count(userId);

    string json = "{ \"id\": " + to_string(c.id) +
                  ", \"name\": \"" + jsonEscape(c.name) + "\"" +
                  ", \"desc\": \"" + jsonEscape(c.description) + "\"" +
                  ", \"is_member\": " + (isMember ? "true" : "false") +
                  ", \"is_mod\": " + (isMod ? "true" : "false") +
                  ", \"is_admin\": " + (isAdmin ? "true" : "false") +
                  ", \"total_msgs\": " + to_string(c.chatHistory.size()) + ", \"messages\": [";

    int total = c.chatHistory.size();
    int end = total - offset;
    int start = max(0, end - limit);

    for (int i = start; i < end; i++)
    {
        if (i < 0 || i >= total)
            continue;
        Message &m = c.chatHistory[i];
        bool hasVoted = m.upvoters.count(userId);

        string avatar = "";
        if (userDB.find(m.senderId) != userDB.end())
            avatar = userDB[m.senderId].avatarUrl;

        // Poll JSON
        string pollJson = "null";
        if (m.type == "poll")
        {
            pollJson = "{ \"question\": \"" + jsonEscape(m.poll.question) + "\", \"multi\": " + (m.poll.allowMultiple ? "true" : "false") + ", \"options\": [";
            for (size_t k = 0; k < m.poll.options.size(); k++)
            {
                const auto &opt = m.poll.options[k];
                bool userVoted = opt.voterIds.count(userId);
                pollJson += "{ \"id\": " + to_string(opt.id) + ", \"text\": \"" + jsonEscape(opt.text) + "\", \"count\": " + to_string(opt.voterIds.size()) + ", \"voted\": " + (userVoted ? "true" : "false") + " }";
                if (k < m.poll.options.size() - 1)
                    pollJson += ", ";
            }
            pollJson += "] }";
        }

        string replyPreview = "";
        if (m.replyToId != -1)
        {
            for (const auto &orig : c.chatHistory)
            {
                if (orig.id == m.replyToId)
                {
                    string txt = (orig.type == "image") ? "[Image]" : orig.content;
                    replyPreview = sanitize(txt.substr(0, 30));
                    break;
                }
            }
        }

        json += "{ \"index\": " + to_string(i) +
                ", \"id\": " + to_string(m.id) +
                ", \"sender\": \"" + jsonEscape(m.senderName) + "\"" +
                ", \"senderId\": " + to_string(m.senderId) +
                ", \"senderAvatar\": \"" + jsonEscape(avatar) + "\"" +
                ", \"content\": \"" + jsonEscape(m.content) + "\"" +
                ", \"type\": \"" + m.type + "\"" +
                ", \"mediaUrl\": \"" + jsonEscape(m.mediaUrl) + "\"" +
                ", \"poll\": " + pollJson +
                ", \"time\": \"" + m.timestamp + "\"" +
                ", \"votes\": " + to_string(m.upvoters.size()) +
                ", \"has_voted\": " + (hasVoted ? "true" : "false") +
                ", \"pinned\": " + (m.isPinned ? "true" : "false") +
                ", \"replyTo\": " + to_string(m.replyToId) +
                ", \"replyPreview\": \"" + jsonEscape(replyPreview) + "\" }";
        if (i < end - 1)
            json += ", ";
    }
    json += "] }";
    return json;
}

string NovaGraph::getJoinedCommunitiesJSON(int userId)
{
    string json = "[";
    int count = 0;

    for (auto const &[id, c] : communityDB)
    {
        // ONLY add to JSON if the user is actually in the members set
        if (c.members.count(userId))
        {
            if (count > 0)
                json += ", ";
            json += "{ \"id\": " + to_string(c.id) +
                    ", \"name\": \"" + jsonEscape(c.name) + "\" }";
            count++;
        }
    }
    json += "]";
    return json;
}

string NovaGraph::getConnectionsByDegreeJSON(int startNode, int targetDegree)
{
    if (userDB.find(startNode) == userDB.end())
        return "[]";
    queue<pair<int, int>> q;
    q.push({startNode, 0});
    set<int> visited;
    visited.insert(startNode);
    vector<int> resultIDs;
    while (!q.empty())
    {
        auto [currentUser, depth] = q.front();
        q.pop();
        if (depth == targetDegree)
        {
            resultIDs.push_back(currentUser);
            continue;
        }
        if (depth > targetDegree)
            continue;
        for (int neighbor : adjList[currentUser])
            if (visited.find(neighbor) == visited.end())
            {
                visited.insert(neighbor);
                q.push({neighbor, depth + 1});
            }
    }
    string json = "[";
    for (size_t i = 0; i < resultIDs.size(); ++i)
    {
        User &u = userDB[resultIDs[i]];
        json += "{ \"id\": " + to_string(u.id) + ", \"name\": \"" + jsonEscape(u.username) + "\", \"degree\": " + to_string(targetDegree) + " }";
        if (i < resultIDs.size() - 1)
            json += ", ";
    }
    json += "]";
    return json;
}

string NovaGraph::getRecommendationsJSON(int userId)
{
    if (adjList.find(userId) == adjList.end())
        return "[]";
    map<int, int> frequencyMap;
    const vector<int> &myFriends = adjList[userId];
    set<int> existingFriends(myFriends.begin(), myFriends.end());
    existingFriends.insert(userId);
    for (int friendId : myFriends)
        for (int candidate : adjList[friendId])
            if (existingFriends.find(candidate) == existingFriends.end())
                frequencyMap[candidate]++;
    vector<pair<int, int>> candidates;
    for (auto const &[id, count] : frequencyMap)
        candidates.push_back({id, count});
    sort(candidates.begin(), candidates.end(), [](const pair<int, int> &a, const pair<int, int> &b)
         { return a.second > b.second; });
    string json = "[";
    for (size_t i = 0; i < candidates.size(); ++i)
    {
        int id = candidates[i].first;
        string name = userDB[id].username;
        json += "{ \"id\": " + to_string(id) + ", \"name\": \"" + jsonEscape(name) + "\", \"mutual_friends\": " + to_string(candidates[i].second) + " }";
        if (i < candidates.size() - 1)
            json += ", ";
    }
    json += "]";
    return json;
}

string NovaGraph::getGraphVisualJSON()
{
    string json = "{ \"nodes\": [";
    int count = 0;
    for (auto const &[id, u] : userDB)
    {
        if (count > 0)
            json += ", ";
        int friendCount = adjList[id].size();

        // ADDED "avatar" field here
        json += "{ \"id\": " + to_string(id) +
                ", \"name\": \"" + jsonEscape(u.username) + "\"" +
                ", \"avatar\": \"" + jsonEscape(u.avatarUrl) + "\"" +
                ", \"val\": " + to_string(friendCount + 1) + " }";
        count++;
    }
    json += "], \"links\": [";
    count = 0;
    set<string> pe;
    for (auto const &[u, friends] : adjList)
    {
        for (int v : friends)
        {
            int mi = min(u, v);
            int ma = max(u, v);
            string ek = to_string(mi) + "-" + to_string(ma);
            if (pe.find(ek) == pe.end())
            {
                if (count > 0)
                    json += ", ";
                json += "{ \"source\": " + to_string(u) + ", \"target\": " + to_string(v) + " }";
                pe.insert(ek);
                count++;
            }
        }
    }
    return json + "] }";
}

int NovaGraph::getRelationDegree(int startNode, int targetNode)
{
    if (startNode == targetNode)
        return 0;
    if (adjList.find(startNode) == adjList.end())
        return -1;
    queue<pair<int, int>> q;
    q.push({startNode, 0});
    set<int> visited;
    visited.insert(startNode);
    while (!q.empty())
    {
        auto [currentUser, depth] = q.front();
        q.pop();
        if (currentUser == targetNode)
            return depth;
        if (depth >= 3)
            continue;
        for (int neighbor : adjList[currentUser])
            if (visited.find(neighbor) == visited.end())
            {
                visited.insert(neighbor);
                q.push({neighbor, depth + 1});
            }
    }
    return -1;
}

string NovaGraph::searchUsersJSON(string query, string tagFilter)
{
    string json = "[";
    int count = 0;
    transform(query.begin(), query.end(), query.begin(), ::tolower);
    for (auto const &[id, u] : userDB)
    {
        string nameLower = u.username;
        transform(nameLower.begin(), nameLower.end(), nameLower.begin(), ::tolower);
        bool nameMatch = query.empty() || (nameLower.find(query) != string::npos);
        bool tagMatch = (tagFilter == "All");
        if (!tagMatch)
            for (const string &t : u.tags)
                if (t == tagFilter)
                {
                    tagMatch = true;
                    break;
                }
        if (nameMatch && tagMatch)
        {
            if (count > 0)
                json += ", ";
            json += "{ \"id\": " + to_string(u.id) + ", \"name\": \"" + jsonEscape(u.username) + "\", \"avatar\": \"" + jsonEscape(u.avatarUrl) + "\", \"karma\": " + to_string(u.karma) + " }";
            count++;
        }
    }
    json += "]";
    return json;
}

string NovaGraph::getPopularCommunitiesJSON()
{
    vector<Community> comms;
    for (auto const &[id, c] : communityDB)
        comms.push_back(c);
    sort(comms.begin(), comms.end(), [](const Community &a, const Community &b)
         { return a.members.size() > b.members.size(); });
    string json = "[";
    for (size_t i = 0; i < comms.size() && i < 5; i++)
    {
        Community &c = comms[i];
        if (i > 0)
            json += ", ";
        json += "{ \"id\": " + to_string(c.id) + ", \"name\": \"" + jsonEscape(c.name) + "\", \"members\": " + to_string(c.members.size()) + ", \"cover\": \"" + jsonEscape(c.coverUrl) + "\" }";
    }
    json += "]";
    return json;
}

// 1. SMART USER RECOMMENDER (Mutual Friend Count Logic)

// Helper to get distances for a user up to 3 degrees
// Returns map of {UserID -> Distance}

// Helper to get distances for a user up to 3 degrees
// Returns map of {UserID -> Distance}
map<int, int> NovaGraph::getDistancesBFS(int startId)
{
    map<int, int> distances;
    queue<pair<int, int>> q;

    q.push({startId, 0});
    distances[startId] = 0;

    while (!q.empty())
    {
        auto [currentId, dist] = q.front();
        q.pop();

        if (dist >= 3)
            continue;

        if (adjList.count(currentId))
        {
            for (int neighbor : adjList[currentId])
            {
                if (distances.find(neighbor) == distances.end())
                {
                    distances[neighbor] = dist + 1;
                    q.push({neighbor, dist + 1});
                }
            }
        }
    }
    return distances;
}

// 1. ADVANCED USER RECOMMENDER (2nd & 3rd Degree)
string NovaGraph::getSmartUserRecommendations(int userId)
{
    map<int, int> distMap = getDistancesBFS(userId);
    map<int, double> scoreMap;

    for (auto const &[targetId, dist] : distMap)
    {
        // RULE: Skip self (0) and existing friends (1)
        if (dist == 0 || dist == 1)
            continue;

        if (dist == 2)
        {
            scoreMap[targetId] += 10.0; // Base score for 2nd degree
            // Add 2 points for every mutual friend
            for (int f : adjList[userId])
            {
                const auto &targetFriends = adjList[targetId];
                if (find(targetFriends.begin(), targetFriends.end(), f) != targetFriends.end())
                {
                    scoreMap[targetId] += 2.0;
                }
            }
        }
        else if (dist == 3)
        {
            scoreMap[targetId] += 2.0; // Base score for 3rd degree
        }
    }

    vector<pair<int, double>> sorted(scoreMap.begin(), scoreMap.end());
    sort(sorted.begin(), sorted.end(), [](const auto &a, const auto &b)
         { return a.second > b.second; });

    string json = "[";
    for (size_t i = 0; i < sorted.size() && i < 10; i++)
    {
        int rid = sorted[i].first;
        if (userDB.find(rid) == userDB.end())
            continue;
        User &u = userDB[rid];
        if (i > 0)
            json += ", ";
        json += "{ \"id\": " + to_string(u.id) +
                ", \"name\": \"" + jsonEscape(u.username) + "\"" +
                ", \"avatar\": \"" + jsonEscape(u.avatarUrl) + "\"" +
                ", \"degree\": \"" + (distMap[rid] == 2 ? "2nd" : "3rd") + "\"" +
                ", \"score\": " + to_string((int)sorted[i].second) + " }";
    }
    json += "]";
    return json;
}

// 2. ADVANCED COMMUNITY RECOMMENDER (1st, 2nd, & 3rd Degree Influence)
string NovaGraph::getSmartCommunityRecommendations(int userId)
{
    map<int, int> distMap = getDistancesBFS(userId);
    map<int, double> commScores;

    for (auto const &[memberId, dist] : distMap)
    {
        if (dist == 0)
            continue; // dist 0 is you

        // Points given to a community based on who in your network is in it
        double weight = (dist == 1) ? 5.0 : (dist == 2 ? 2.0 : 0.5);

        for (auto const &[commId, comm] : communityDB)
        {
            // RULE: If YOU are already a member, do not recommend
            if (comm.members.count(userId))
                continue;

            // If a person in your network is a member, increase community score
            if (comm.members.count(memberId))
            {
                commScores[commId] += weight;
            }
        }
    }

    vector<pair<int, double>> sorted(commScores.begin(), commScores.end());
    sort(sorted.begin(), sorted.end(), [](const auto &a, const auto &b)
         { return a.second > b.second; });

    string json = "[";
    for (size_t i = 0; i < sorted.size() && i < 6; i++)
    {
        Community &c = communityDB[sorted[i].first];
        if (i > 0)
            json += ", ";
        json += "{ \"id\": " + to_string(c.id) +
                ", \"name\": \"" + jsonEscape(c.name) + "\"" +
                ", \"score\": " + to_string((int)sorted[i].second) +
                ", \"desc\": \"" + jsonEscape(c.description.substr(0, 40)) + "...\" }";
    }
    json += "]";
    return json;
}

// ==========================================
// 1. NAVIGATOR (UNDO/REDO STACK ENGINE)
// ==========================================

// We store the stacks in a map so every user has their own history session
// Key: UserId -> pair of <BackStack, ForwardStack>
map<int, pair<vector<string>, vector<string>>> globalNavHistory;

// Helper to save stacks to data/nav.txt
void saveNav(int uid, vector<string> back, vector<string> forward)
{
    ofstream f("data/nav_" + to_string(uid) + ".txt");
    for (auto s : back)
        f << "B|" << s << endl;
    for (auto s : forward)
        f << "F|" << s << endl;
}

// Helper to load stacks
pair<vector<string>, vector<string>> loadNav(int uid)
{
    vector<string> b, f;
    ifstream file("data/nav_" + to_string(uid) + ".txt");
    string line;
    while (getline(file, line))
    {
        if (line.empty())
            continue;
        if (line.substr(0, 2) == "B|")
            b.push_back(line.substr(2));
        else if (line.substr(0, 2) == "F|")
            f.push_back(line.substr(2));
    }
    if (b.empty())
        b.push_back("home");
    return {b, f};
}

void NovaGraph::navPush(int userId, string tab)
{
    auto [back, forward] = loadNav(userId);
    if (!back.empty() && back.back() == tab)
        return;
    back.push_back(tab);
    saveNav(userId, back, {}); // New nav always clears forward stack
}

string NovaGraph::navBack(int userId)
{
    auto [back, forward] = loadNav(userId);
    if (back.size() <= 1)
        return back.back();

    string current = back.back();
    back.pop_back();
    forward.insert(forward.begin(), current); // Push to forward stack
    saveNav(userId, back, forward);
    return back.back();
}

string NovaGraph::navForward(int userId)
{
    auto [back, forward] = loadNav(userId);
    if (forward.empty())
        return !back.empty() ? back.back() : "home";

    string next = forward.front();
    forward.erase(forward.begin());
    back.push_back(next);
    saveNav(userId, back, forward);
    return next;
}