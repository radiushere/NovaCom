#pragma once
#include "User.hpp"
#include <unordered_map>
#include <vector>
#include <string>
#include <iostream>

using namespace std;

class NovaGraph {
private:
    // --- Data Stores ---
    unordered_map<int, User> userDB;
    unordered_map<int, vector<int>> adjList; // The Social Graph

    // --- Helper Functions ---
    vector<string> split(const string& s, char delimiter);

public:
    // --- Core Lifecycle ---
    void loadData(); // Loads users.txt and graph.txt
    void saveData(); // Saves to data/ folder

    // --- Graph Operations ---
    void addUser(int id, string name);
    void addFriendship(int u, int v);

    // --- API Responses (JSON Strings) ---
    string getUserJSON(int id);
    string getFriendListJSON(int id);
};