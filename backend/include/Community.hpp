#pragma once
#include <string>
#include <vector>
#include <set>
#include <map>

using namespace std;

// 1. POLL STRUCTURES
struct PollOption {
    int id;
    string text;
    set<int> voterIds; // Who voted for this option
};

struct PollData {
    string question;
    bool allowMultiple;
    vector<PollOption> options;
};

struct Message {
    int id = 0;
    int senderId;
    string senderName;
    string content; // For text messages
    string timestamp;
    set<int> upvoters;
    bool isPinned = false;
    int replyToId = -1; 
    string type = "text"; // "text" or "poll"
    
    // 2. POLL DATA OBJECT
    PollData poll; 
};

struct Community {
    int id;
    string name;
    string description;
    string coverUrl;
    vector<string> tags;
    set<int> members;
    vector<Message> chatHistory;
    
    set<int> moderators;
    set<int> admins;
    set<int> bannedUsers;
    
    int nextMsgId = 1;
};