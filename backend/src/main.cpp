#include "../include/Graph.hpp"
#include <iostream>
#include <string>

using namespace std;

// COMMANDS:
// backend.exe add_user <id> <name>
// backend.exe add_friend <id1> <id2>
// backend.exe get_friends <id>
// backend.exe get_degrees <id> <degree>
// backend.exe get_recommendations <id>

int main(int argc, char* argv[]) {
    NovaGraph graph;
    
    // Ensure the data folder exists manually before running!
    graph.loadData();

    if (argc < 2) {
        cout << "{ \"error\": \"No command provided\" }" << endl;
        return 1;
    }

    string command = argv[1];

    if (command == "add_user") {
        if (argc < 4) return 1;
        graph.addUser(stoi(argv[2]), argv[3]);
        graph.saveData();
        cout << "{ \"status\": \"success\", \"message\": \"User added\" }" << endl;
    }
    else if (command == "add_friend") {
        if (argc < 4) return 1;
        graph.addFriendship(stoi(argv[2]), stoi(argv[3]));
        graph.saveData();
        cout << "{ \"status\": \"success\", \"message\": \"Friendship added\" }" << endl;
    }
    else if (command == "get_friends") {
        if (argc < 3) return 1;
        cout << graph.getFriendListJSON(stoi(argv[2])) << endl;
    }
    // --- NEW COMMANDS ---
    else if (command == "get_degrees") {
        // Usage: get_degrees <UserID> <Degree(2 or 3)>
        if (argc < 4) return 1;
        cout << graph.getConnectionsByDegreeJSON(stoi(argv[2]), stoi(argv[3])) << endl;
    }
    else if (command == "get_recommendations") {
        // Usage: get_recommendations <UserID>
        if (argc < 3) return 1;
        cout << graph.getRecommendationsJSON(stoi(argv[2])) << endl;
    }
	else if (command == "get_user") {
        // Usage: backend.exe get_user <UserID>
        if (argc < 3) return 1;
        cout << graph.getUserJSON(stoi(argv[2])) << endl;
    }
	else if (command == "create_community") {
        // create_community <Name> <Desc> <Tags(comma_sep)>
        if (argc < 5) return 1;
        graph.createCommunity(argv[2], argv[3], argv[4]);
        graph.saveData();
        cout << "{ \"status\": \"success\" }" << endl;
    }
    else if (command == "join_community") {
        if (argc < 4) return 1;
        graph.joinCommunity(stoi(argv[2]), stoi(argv[3]));
        graph.saveData();
        cout << "{ \"status\": \"joined\" }" << endl;
    }
    else if (command == "send_message") {
        // send_message <commId> <senderId> <content>
        if (argc < 5) return 1;
        graph.addMessage(stoi(argv[2]), stoi(argv[3]), argv[4]);
        // Note: Chat history is in memory for now. 
        // To save chat to file, you'd add that to saveData(), but let's keep it simple.
        cout << "{ \"status\": \"sent\" }" << endl;
    }
    else if (command == "get_all_communities") {
        cout << graph.getAllCommunitiesJSON() << endl;
    }
    else if (command == "get_community") {
        // get_community <commId> <viewingUserId>
        if (argc < 4) return 1;
        cout << graph.getCommunityDetailsJSON(stoi(argv[2]), stoi(argv[3])) << endl;
    }
    else {
        cout << "{ \"error\": \"Unknown command\" }" << endl;
    }

    return 0;
}