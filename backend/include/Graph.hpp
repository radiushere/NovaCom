#pragma once
#include "User.hpp"
#include "Community.hpp"
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
    // --- DATA STORAGE ---
    unordered_map<int, User> userDB;              // Stores User Data
    unordered_map<string, int> usernameIndex;     // Maps Username -> ID (For fast login/search)
    unordered_map<int, vector<int>> adjList;      // Social Graph (Friendships)
    unordered_map<int, Community> communityDB;    // Stores Communities
    int nextCommunityId = 100;                    // Auto-increment ID

    // --- HELPERS ---
    vector<string> split(const string& s, char delimiter);

public:
    // --- PERSISTENCE ---
    void loadData();
    void saveData();

    // --- AUTHENTICATION & USER MANAGEMENT ---
    int registerUser(string username, string email, string password, string avatar, string tags);
    int loginUser(string username, string password);
    void updateUserProfile(int id, string email, string avatar, string tags);

    // --- CORE GRAPH OPERATIONS ---
    void addUser(int id, string username);
    void addFriendship(int u, int v);

    // --- COMMUNITY OPERATIONS ---
    void createCommunity(string name, string desc, string tags, int creatorId, string coverUrl);
    void joinCommunity(int userId, int commId);
    void leaveCommunity(int userId, int commId);
    void addMessage(int commId, int senderId, string content);

    // --- MODERATION & INTERACTION ---
    void banUser(int commId, int adminId, int targetId);
    void unbanUser(int commId, int adminId, int targetId);
    void deleteMessage(int commId, int adminId, int msgIndex);
    void pinMessage(int commId, int adminId, int msgIndex);
    void upvoteMessage(int commId, int userId, int msgIndex);

    // --- JSON API VIEWS (For Frontend) ---
    string getUserJSON(int id);
    string getFriendListJSON(int id);
    string getAllCommunitiesJSON();
    
    // Pagination supported: offset = skip N messages, limit = take N messages
    string getCommunityDetailsJSON(int commId, int userId, int offset = 0, int limit = 50);
    
    string searchUsersJSON(string query, string tagFilter);
    string getPopularCommunitiesJSON();
    string getGraphVisualJSON();
    string getRecommendationsJSON(int userId);
    string getConnectionsByDegreeJSON(int startNode, int targetDegree);
    string getCommunityMembersJSON(int commId);
    
    // --- ALGORITHMS ---
    int getRelationDegree(int startNode, int targetNode);
};