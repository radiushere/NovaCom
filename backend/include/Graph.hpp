#pragma once
#include "User.hpp"
#include "Community.hpp" // <--- Include this
#include <unordered_map>
#include <vector>
#include <string>
#include <iostream>
#include <queue>
#include <set>
#include <map>
#include <algorithm>

using namespace std;

class NovaGraph {
private:
    unordered_map<int, User> userDB;
    unordered_map<int, vector<int>> adjList;
    
    // --- NEW STORAGE ---
    unordered_map<int, Community> communityDB;
    int nextCommunityId = 100; // Auto-increment ID

    vector<string> split(const string& s, char delimiter);

public:
    void loadData();
    void saveData();

    // User/Graph Ops
    void addUser(int id, string name);
    void addFriendship(int u, int v);

    // --- COMMUNITY OPS ---
    void createCommunity(string name, string desc, string tags, int creatorId);
    void joinCommunity(int userId, int commId);
    void leaveCommunity(int userId, int commId);
    void addMessage(int commId, int senderId, string content);
	
	int getRelationDegree(int startNode, int targetNode);
	
    void unbanUser(int commId, int adminId, int targetId);
    void upvoteMessage(int commId, int userId, int msgIndex);
	
    // New Mod functions
    void banUser(int commId, int adminId, int targetId);
    void deleteMessage(int commId, int adminId, int msgIndex);
    void pinMessage(int commId, int adminId, int msgIndex);
	
	string getGraphVisualJSON();

    // --- READ VIEWS (JSON) ---
    string getUserJSON(int id);
    string getFriendListJSON(int id);
    string getConnectionsByDegreeJSON(int startNode, int targetDegree);
    string getRecommendationsJSON(int userId);
    
    // New JSON Views
    string getAllCommunitiesJSON(); // For Explorer
    string getCommunityDetailsJSON(int commId, int userId, int offset = 0, int limit = 50);
};