#pragma once
#include <string>
#include <vector>
#include <set>

using namespace std;

struct Message {
    int id;
    int senderId;
    string senderName;
    string content;
    string timestamp;
    set<int> upvoters;
    bool isPinned = false;
};

struct Community {
    int id;
    string name;
    string description;
    string coverUrl;
    vector<string> tags;
    set<int> members;
    vector<Message> chatHistory;
    
    set<int> moderators; // The "Owner" (Top level)
    set<int> admins;     // NEW: The "Admins" (Mid level)
    set<int> bannedUsers;
};