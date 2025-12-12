#include "../include/Graph.hpp"
#include <fstream>
#include <sstream>
#include <algorithm>
#include <ctime> // <--- ADDED THIS to fix time error

// --- Helper to get Time ---
string getCurrentTime() {
    time_t now = time(0);
    tm *ltm = localtime(&now);
    char buffer[10];
    sprintf(buffer, "%02d:%02d", ltm->tm_hour, ltm->tm_min);
    return string(buffer);
}

// --- Helper: Split String ---
vector<string> NovaGraph::split(const string& s, char delimiter) {
    vector<string> tokens;
    string token;
    istringstream tokenStream(s);
    while (getline(tokenStream, token, delimiter)) {
        tokens.push_back(token);
    }
    return tokens;
}

// ==========================================
// PERSISTENCE (LOAD/SAVE)
// ==========================================

void NovaGraph::loadData() {
    string line; // <--- Declared ONCE here. Do not declare again below.

    // 1. Load Users (Format: ID,Name)
    ifstream userFile("data/users.txt");
    if (userFile.is_open()) {
        while (getline(userFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, ',');
            if (parts.size() >= 2) {
                int id = stoi(parts[0]);
                string name = parts[1];
                userDB[id] = { id, name, {}, {} };
            }
        }
        userFile.close();
    }

    // 2. Load Friendships (Format: ID,Friend1,Friend2...)
    ifstream graphFile("data/graph.txt");
    if (graphFile.is_open()) {
        while (getline(graphFile, line)) {
            if (line.empty()) continue;
            auto parts = split(line, ',');
            int id = stoi(parts[0]);
            for (size_t i = 1; i < parts.size(); i++) {
                adjList[id].push_back(stoi(parts[i]));
            }
        }
        graphFile.close();
    }

    // 3. Load Communities
    ifstream commFile("data/communities.txt");
    if (commFile.is_open()) {
        while (getline(commFile, line)) { // Reuse 'line' variable
            if (line.empty()) continue;
            auto parts = split(line, '|'); // Use pipe | as delimiter
            if (parts.size() >= 4) {
                Community c;
                c.id = stoi(parts[0]);
                c.name = parts[1];
                c.description = parts[2];
                
                // Parse Tags (comma separated)
                auto tagList = split(parts[3], ',');
                for(auto t : tagList) c.tags.push_back(t);

                // Parse Members (comma separated)
                if (parts.size() > 4 && parts[4] != "NULL") {
                    auto memList = split(parts[4], ',');
                    for(auto m : memList) c.members.insert(stoi(m));
                }

                communityDB[c.id] = c;
                if (c.id >= nextCommunityId) nextCommunityId = c.id + 1;
            }
        }
        commFile.close();
    }
}

void NovaGraph::saveData() {
    // 1. Save Users
    ofstream userFile("data/users.txt");
    for (auto const& [id, user] : userDB) {
        userFile << id << "," << user.name << "\n";
    }
    userFile.close();

    // 2. Save Graph
    ofstream graphFile("data/graph.txt");
    for (auto const& [id, friends] : adjList) {
        graphFile << id;
        for (int friendID : friends) {
            graphFile << "," << friendID;
        }
        graphFile << "\n";
    }
    graphFile.close();

    // 3. Save Communities
    ofstream commFile("data/communities.txt");
    for (auto const& [id, c] : communityDB) {
        commFile << c.id << "|" << c.name << "|" << c.description << "|";
        
        // Tags
        for(size_t i=0; i<c.tags.size(); i++) 
            commFile << c.tags[i] << (i < c.tags.size()-1 ? "," : "");
        commFile << "|";

        // Members
        if(c.members.empty()) commFile << "NULL";
        else {
            int i = 0;
            for(int m : c.members) {
                commFile << m << (i < c.members.size()-1 ? "," : "");
                i++;
            }
        }
        commFile << "\n";
    }
    commFile.close();
}

// ==========================================
// GRAPH & USER LOGIC
// ==========================================

void NovaGraph::addUser(int id, string name) {
    if (userDB.find(id) != userDB.end()) return;
    userDB[id] = { id, name, {}, {} };
}

void NovaGraph::addFriendship(int u, int v) {
    if (u == v) return;
    auto& uFriends = adjList[u];
    if (find(uFriends.begin(), uFriends.end(), v) != uFriends.end()) return;

    adjList[u].push_back(v);
    adjList[v].push_back(u);
}

// ==========================================
// COMMUNITY LOGIC
// ==========================================

void NovaGraph::createCommunity(string name, string desc, string tags) {
    Community c;
    c.id = nextCommunityId++;
    c.name = name;
    c.description = desc;
    c.tags = split(tags, ',');
    communityDB[c.id] = c;
}

void NovaGraph::joinCommunity(int userId, int commId) {
    if (communityDB.find(commId) != communityDB.end()) {
        communityDB[commId].members.insert(userId);
    }
}

void NovaGraph::addMessage(int commId, int senderId, string content) {
    if (communityDB.find(commId) != communityDB.end()) {
        if (communityDB[commId].members.count(senderId)) {
            Message m;
            m.senderId = senderId;
            m.senderName = userDB[senderId].name;
            m.content = content;
            m.timestamp = getCurrentTime();
            communityDB[commId].chatHistory.push_back(m);
        }
    }
}

string NovaGraph::getAllCommunitiesJSON() {
    string json = "[";
    int count = 0;
    for (auto const& [id, c] : communityDB) {
        if (count > 0) json += ", ";
        json += "{ \"id\": " + to_string(c.id) + 
                ", \"name\": \"" + c.name + "\"" +
                ", \"desc\": \"" + c.description + "\"" +
                ", \"members\": " + to_string(c.members.size()) + 
                ", \"tags\": [";
        for(size_t i=0; i<c.tags.size(); i++) 
            json += "\"" + c.tags[i] + "\"" + (i < c.tags.size()-1 ? "," : "");
        json += "] }";
        count++;
    }
    json += "]";
    return json;
}

string NovaGraph::getCommunityDetailsJSON(int commId, int userId) {
    if (communityDB.find(commId) == communityDB.end()) return "{}";
    
    Community& c = communityDB[commId];
    bool isMember = c.members.count(userId);

    string json = "{ \"id\": " + to_string(c.id) + 
                  ", \"name\": \"" + c.name + "\"" +
                  ", \"desc\": \"" + c.description + "\"" +
                  ", \"is_member\": " + (isMember ? "true" : "false") + 
                  ", \"messages\": [";
    
    for(size_t i=0; i<c.chatHistory.size(); i++) {
        Message& m = c.chatHistory[i];
        json += "{ \"sender\": \"" + m.senderName + "\"" +
                ", \"content\": \"" + m.content + "\"" +
                ", \"time\": \"" + m.timestamp + "\" }";
        if(i < c.chatHistory.size() - 1) json += ", ";
    }
    json += "] }";
    return json;
}

// ==========================================
// ALGORITHMS (BFS & RECOMMENDATION)
// ==========================================

string NovaGraph::getConnectionsByDegreeJSON(int startNode, int targetDegree) {
    if (userDB.find(startNode) == userDB.end()) return "[]";

    queue<pair<int, int>> q;
    q.push({ startNode, 0 });

    set<int> visited;
    visited.insert(startNode);

    vector<int> resultIDs;

    while (!q.empty()) {
        auto [currentUser, depth] = q.front();
        q.pop();

        if (depth == targetDegree) {
            resultIDs.push_back(currentUser);
            continue;
        }

        if (depth > targetDegree) continue;

        for (int neighbor : adjList[currentUser]) {
            if (visited.find(neighbor) == visited.end()) {
                visited.insert(neighbor);
                q.push({ neighbor, depth + 1 });
            }
        }
    }

    string json = "[";
    for (size_t i = 0; i < resultIDs.size(); ++i) {
        User& u = userDB[resultIDs[i]];
        json += "{ \"id\": " + to_string(u.id) + ", \"name\": \"" + u.name + "\", \"degree\": " + to_string(targetDegree) + " }";
        if (i < resultIDs.size() - 1) json += ", ";
    }
    json += "]";
    return json;
}

string NovaGraph::getRecommendationsJSON(int userId) {
    if (adjList.find(userId) == adjList.end()) return "[]";

    map<int, int> frequencyMap;
    const vector<int>& myFriends = adjList[userId];
    set<int> existingFriends(myFriends.begin(), myFriends.end());
    existingFriends.insert(userId);

    for (int friendId : myFriends) {
        for (int candidate : adjList[friendId]) {
            if (existingFriends.find(candidate) == existingFriends.end()) {
                frequencyMap[candidate]++;
            }
        }
    }

    vector<pair<int, int>> candidates;
    for (auto const& [id, count] : frequencyMap) {
        candidates.push_back({ id, count });
    }

    sort(candidates.begin(), candidates.end(), [](const pair<int, int>& a, const pair<int, int>& b) {
        return a.second > b.second;
    });

    string json = "[";
    for (size_t i = 0; i < candidates.size(); ++i) {
        int id = candidates[i].first;
        int mutuals = candidates[i].second;
        string name = userDB[id].name;

        json += "{ \"id\": " + to_string(id) + 
                ", \"name\": \"" + name + "\"" +
                ", \"mutual_friends\": " + to_string(mutuals) + " }";
        
        if (i < candidates.size() - 1) json += ", ";
    }
    json += "]";
    return json;
}

// ==========================================
// BASIC VIEWS
// ==========================================

string NovaGraph::getUserJSON(int id) {
    if (userDB.find(id) == userDB.end()) return "{}";
    return "{ \"id\": " + to_string(id) + ", \"name\": \"" + userDB[id].name + "\" }";
}

string NovaGraph::getFriendListJSON(int id) {
    string json = "[";
    if (adjList.find(id) != adjList.end()) {
        const auto& friends = adjList[id];
        for (size_t i = 0; i < friends.size(); ++i) {
            User& f = userDB[friends[i]];
            json += "{ \"id\": " + to_string(f.id) + ", \"name\": \"" + f.name + "\" }";
            if (i < friends.size() - 1) json += ", ";
        }
    }
    json += "]";
    return json;
}