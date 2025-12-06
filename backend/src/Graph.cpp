#include "../include/Graph.hpp"
#include <fstream>
#include <sstream>
#include <algorithm>

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

// --- Persistence: Load Data ---
void NovaGraph::loadData() {
    // 1. Load Users (Format: ID,Name)
    ifstream userFile("data/users.txt");
    string line;
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
}

// --- Persistence: Save Data ---
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
}

// --- Logic ---
void NovaGraph::addUser(int id, string name) {
    if (userDB.find(id) != userDB.end()) return; // Exists
    userDB[id] = { id, name, {}, {} };
}

void NovaGraph::addFriendship(int u, int v) {
    adjList[u].push_back(v);
    adjList[v].push_back(u); // Undirected graph
}

// --- JSON Formatting ---
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