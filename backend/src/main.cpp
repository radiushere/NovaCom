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
	
    else if (command == "join_community") {
        if (argc < 4) return 1;
        graph.joinCommunity(stoi(argv[2]), stoi(argv[3]));
        graph.saveData();
        cout << "{ \"status\": \"joined\" }" << endl;
    }
	
   else if (command == "send_message") {
        // send_message <commId> <senderId> <content>
        // Note: If content has spaces, argv will split it. We need to combine argv[4]...argv[end]
        if (argc < 5) return 1;
        
        // Combine all remaining arguments into one message string
        string content = argv[4];
        for (int i = 5; i < argc; ++i) {
            content += " " + string(argv[i]);
        }

        graph.addMessage(stoi(argv[2]), stoi(argv[3]), content);
        // Note: addMessage now calls saveData() internally
        cout << "{ \"status\": \"sent\" }" << endl;
    }
	
    else if (command == "get_all_communities") {
        cout << graph.getAllCommunitiesJSON() << endl;
    }
	
      else if (command == "get_community") {
        // get_community <commId> <userId> [offset] [limit]
        int offset = (argc > 4) ? stoi(argv[4]) : 0;
        int limit = (argc > 5) ? stoi(argv[5]) : 50;
        cout << graph.getCommunityDetailsJSON(stoi(argv[2]), stoi(argv[3]), offset, limit) << endl;
    }
	
	else if (command == "get_relation") {
        if (argc < 4) return 1;
        int deg = graph.getRelationDegree(stoi(argv[2]), stoi(argv[3]));
        cout << "{ \"degree\": " << deg << " }" << endl;
    }
	
    else if (command == "vote_message") {
        // vote_message <commId> <userId> <msgIndex>  <-- CHANGED ARGS
        if (argc < 5) return 1;
        graph.upvoteMessage(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"voted\" }" << endl;
    }
	
	else if (command == "create_community") {
        // We need 6 arguments now: Program, Command, Name, Desc, Tags, CreatorID
        if (argc < 6) return 1;
        
        // Notice the 4th argument here: stoi(argv[5])
        graph.createCommunity(argv[2], argv[3], argv[4], stoi(argv[5]));
        
        graph.saveData();
        cout << "{ \"status\": \"success\" }" << endl;
    }
	
	else if (command == "leave_community") {
        // leave_community <userId> <commId>
        if (argc < 4) return 1;
        graph.leaveCommunity(stoi(argv[2]), stoi(argv[3]));
        graph.saveData();
        cout << "{ \"status\": \"left\" }" << endl;
    }
	
    else if (command == "mod_ban") {
        // mod_ban <commId> <adminId> <targetId>
        if (argc < 5) return 1;
        graph.banUser(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        graph.saveData();
        cout << "{ \"status\": \"banned\" }" << endl;
    }
	
	else if (command == "mod_unban") {
        if (argc < 5) return 1;
        graph.unbanUser(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"unbanned\" }" << endl;
    }
	
    else if (command == "mod_delete") {
        // mod_delete <commId> <adminId> <msgIndex>
        if (argc < 5) return 1;
        graph.deleteMessage(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"deleted\" }" << endl;
    }
	
    else if (command == "mod_pin") {
        // mod_pin <commId> <adminId> <msgIndex>
        if (argc < 5) return 1;
        graph.pinMessage(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"pinned\" }" << endl;
    }
	
	else if (command == "get_visual_graph") {
        cout << graph.getGraphVisualJSON() << endl;
    }
	
    else {
        cout << "{ \"error\": \"Unknown command\" }" << endl;
    }

    return 0;
}