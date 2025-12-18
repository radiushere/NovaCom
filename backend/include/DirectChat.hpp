#pragma once
#include <string>
#include <vector>

using namespace std;

struct DirectMessage {
    int id;              
    int senderId;
    string content;
    string timestamp;
    
    // METADATA
    int replyToMsgId = -1;  
    string reaction = "";   
    bool isSeen = false;    
    
    // NEW MEDIA FIELDS
    string type = "text";   // "text" or "image"
    string mediaUrl = "";   // URL or Base64 string
};

struct DirectChat {
    string chatKey; 
    vector<DirectMessage> messages;
    int nextMsgId = 1; 
};