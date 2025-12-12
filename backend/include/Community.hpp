#pragma once
#include <string>
#include <vector>
#include <set>

using namespace std;

struct Message {
    int senderId;
    string senderName;
    string content;
    string timestamp; // Simple string for now
};

struct Community {
    int id;
    string name;
    string description;
    vector<string> tags;
    set<int> members; // IDs of users who joined
    vector<Message> chatHistory; // The chat log
};