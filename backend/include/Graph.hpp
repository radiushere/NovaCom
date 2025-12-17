#pragma once
#include "User.hpp"
#include "Community.hpp"
#include "DirectChat.hpp" 
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
    unordered_map<string, int> usernameIndex;
    unordered_map<int, vector<int>> adjList;
    unordered_map<int, Community> communityDB;
	unordered_map<string, DirectChat> dmDB;
    int nextCommunityId = 100;

    vector<string> split(const string& s, char delimiter);

public:
    void loadData();
    void saveData();

    // AUTH
    int registerUser(string username, string email, string password, string avatar, string tags);
    int loginUser(string username, string password);
    void updateUserProfile(int id, string email, string avatar, string tags);

    // CORE
    void addUser(int id, string username);
    void addFriendship(int u, int v);
    void createCommunity(string name, string desc, string tags, int creatorId, string coverUrl);
    void joinCommunity(int userId, int commId);
    void leaveCommunity(int userId, int commId);
    void addMessage(int commId, int senderId, string content);

    // MODERATION & ADMIN (NEW FUNCTIONS HERE)
    void banUser(int commId, int actorId, int targetId);
    void unbanUser(int commId, int actorId, int targetId);
    void deleteMessage(int commId, int actorId, int msgIndex);
    void pinMessage(int commId, int actorId, int msgIndex);
    void upvoteMessage(int commId, int userId, int msgIndex);
    
    // HIERARCHY
    void promoteToAdmin(int commId, int actorId, int targetId);
    void demoteAdmin(int commId, int actorId, int targetId);
    void transferOwnership(int commId, int actorId, int targetId);
	
	// DIRECT MESSAGING
    void sendDirectMessage(int senderId, int receiverId, string content, int replyToId = -1);
    void reactToDirectMessage(int senderId, int receiverId, int msgId, string reaction);

	void deleteUser(int id);

    // VIEWS
    string getUserJSON(int id);
    string getFriendListJSON(int id);
    string getAllCommunitiesJSON();
    string getCommunityDetailsJSON(int commId, int userId, int offset = 0, int limit = 50);
    string searchUsersJSON(string query, string tagFilter);
    string getPopularCommunitiesJSON();
    string getGraphVisualJSON();
    string getRecommendationsJSON(int userId);
    string getConnectionsByDegreeJSON(int startNode, int targetDegree);
    
    // MEMBER LIST (Updated to show admins/bans)
    string getCommunityMembersJSON(int commId);
	
	// Fetches chat AND marks unseen messages from the other person as 'Seen'
    string getDirectChatJSON(int viewerId, int friendId);
    string getActiveDMsJSON(int userId);
    int getRelationDegree(int startNode, int targetNode);
};