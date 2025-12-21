#pragma once
#include "User.hpp"
#include "Community.hpp"
#include "DirectChat.hpp"
#include <map>          // Changed from unordered_map to map for sorted keys
#include <vector>
#include <string>
#include <iostream>
#include <queue>
#include <set>
#include <algorithm>

using namespace std;

class NovaGraph {
private:
    // changed unordered_map to map to match Graph.cpp and ensure sorted data
    map<int, User> userDB;
    map<string, int> usernameIndex;
    map<int, vector<int>> adjList;
    map<int, Community> communityDB;
    map<string, DirectChat> dmDB;
    
    int nextCommunityId = 100;

public:
	vector<string> split(const string& s, char delimiter);
    void loadData();
    void saveData();
    // AUTH
    int registerUser(string username, string email, string password, string avatar, string tags);
    int loginUser(string username, string password);
    void updateUserProfile(int id, string email, string avatar, string tags);
    void deleteUser(int id);

    // CONNECTION LOGIC
    string sendConnectionRequest(int senderId, int targetId);
    void acceptConnectionRequest(int userId, int requesterId);
    void declineConnectionRequest(int userId, int requesterId);
    string getPendingRequestsJSON(int userId);
    string getRelationshipStatus(int me, int target);

    // CORE
    void addUser(int id, string username);
    void addFriendship(int u, int v);
    void createCommunity(string name, string desc, string tags, int creatorId, string coverUrl);
    void joinCommunity(int userId, int commId);
    void leaveCommunity(int userId, int commId);
    
    // UPDATED: Now supports replies and types
    void addMessage(int commId, int senderId, string content, string type = "text", string mediaUrl = "", int replyToId = -1);
    void votePoll(int commId, int userId, int msgIndex, int optionIndex);

    // MODERATION
    void banUser(int commId, int actorId, int targetId);
    void unbanUser(int commId, int actorId, int targetId);
    void deleteMessage(int commId, int actorId, int msgIndex);
    void pinMessage(int commId, int actorId, int msgIndex);
    void upvoteMessage(int commId, int userId, int msgIndex);
    void promoteToAdmin(int commId, int actorId, int targetId);
    void demoteAdmin(int commId, int actorId, int targetId);
    void transferOwnership(int commId, int actorId, int targetId);
	void removeFriendship(int u, int v);
	
	// Creates a poll message
    void createPoll(int commId, int senderId, string question, bool allowMultiple, vector<string> options);
	// Toggles vote
    void togglePollVote(int commId, int userId, int msgId, int optionId);

    // DIRECT MESSAGE
    void sendDirectMessage(int senderId, int receiverId, string content, int replyToId = -1, string type = "text", string mediaUrl = "");
    void reactToDirectMessage(int senderId, int receiverId, int msgId, string reaction);
	void deleteDirectMessage(int userId, int friendId, int msgId);
    string getDirectChatJSON(int viewerId, int friendId, int offset = 0, int limit = 50);
    string getActiveDMsJSON(int userId);

    // VIEWS
    string getUserJSON(int id);
    string getFriendListJSON(int id);
    string getAllCommunitiesJSON();
    string getCommunityDetailsJSON(int commId, int userId, int offset = 0, int limit = 50);
    string searchUsersJSON(string query, string tagFilter);
    string getPopularCommunitiesJSON();
    string getGraphVisualJSON();
    string getRecommendationsJSON(int userId);
    string getCommunityMembersJSON(int commId);
    
    // ALGORITHMS
    int getRelationDegree(int startNode, int targetNode);
    // Added this missing function to fix the error:
    string getConnectionsByDegreeJSON(int startNode, int targetDegree);
	
	string getJoinedCommunitiesJSON(int userId);
};