#pragma once
#include <string>
#include <vector>
#include <set>

using namespace std;

struct Message {
    int id; // Not strictly used for logic yet, but good to have
    int senderId;
    string senderName;
    string content;
    string timestamp;
    set<int> upvoters; // CHANGE: Track User IDs who voted
    bool isPinned = false;
};

struct Community {
    int id;
    string name;
    string description;
    vector<string> tags;
    set<int> members;
    vector<Message> chatHistory;
    
    set<int> moderators;
    set<int> bannedUsers;
};