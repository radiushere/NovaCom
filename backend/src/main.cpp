#include "../include/Graph.hpp"
#include <iostream>
#include <string>

using namespace std;

int main(int argc, char* argv[]) {
    NovaGraph graph;
    graph.loadData();

    if (argc < 2) { cout << "{ \"error\": \"No command provided\" }" << endl; return 1; }
    string command = argv[1];

    if (command == "register") {
        if (argc < 7) { cout << "{ \"error\": \"Missing args\" }" << endl; return 1; }
        int newId = graph.registerUser(argv[2], argv[3], argv[4], argv[5], argv[6]);
        if (newId == -1) cout << "{ \"error\": \"Username taken\" }" << endl;
        else cout << "{ \"id\": " << newId << ", \"status\": \"success\" }" << endl;
    }
    else if (command == "login") {
        if (argc < 4) { cout << "{ \"error\": \"Missing args\" }" << endl; return 1; }
        int id = graph.loginUser(argv[2], argv[3]);
        if (id == -1) cout << "{ \"error\": \"Invalid credentials\" }" << endl;
        else cout << "{ \"id\": " << id << ", \"status\": \"success\" }" << endl;
    }
    else if (command == "update_profile") {
        if (argc < 6) return 1;
        graph.updateUserProfile(stoi(argv[2]), argv[3], argv[4], argv[5]);
        cout << "{ \"status\": \"updated\" }" << endl;
    }
    else if (command == "get_user") {
        if (argc < 3) return 1;
        cout << graph.getUserJSON(stoi(argv[2])) << endl;
    }
    else if (command == "add_friend") {
        if (argc < 4) return 1;
        graph.addFriendship(stoi(argv[2]), stoi(argv[3]));
        graph.saveData();
        cout << "{ \"status\": \"success\" }" << endl;
    }
    else if (command == "get_friends") {
        if (argc < 3) return 1;
        cout << graph.getFriendListJSON(stoi(argv[2])) << endl;
    }
    else if (command == "create_community") {
        if (argc < 7) return 1;
        graph.createCommunity(argv[2], argv[3], argv[4], stoi(argv[5]), argv[6]);
        graph.saveData();
        cout << "{ \"status\": \"success\" }" << endl;
    }
    else if (command == "get_all_communities") {
        cout << graph.getAllCommunitiesJSON() << endl;
    }
    else if (command == "join_community") {
        if (argc < 4) return 1;
        graph.joinCommunity(stoi(argv[2]), stoi(argv[3]));
        graph.saveData();
        cout << "{ \"status\": \"joined\" }" << endl;
    }
    else if (command == "leave_community") {
        if (argc < 4) return 1;
        graph.leaveCommunity(stoi(argv[2]), stoi(argv[3]));
        graph.saveData();
        cout << "{ \"status\": \"left\" }" << endl;
    }
    else if (command == "get_community") {
        int offset = (argc > 4) ? stoi(argv[4]) : 0;
        int limit = (argc > 5) ? stoi(argv[5]) : 50;
        cout << graph.getCommunityDetailsJSON(stoi(argv[2]), stoi(argv[3]), offset, limit) << endl;
    }
    else if (command == "get_community_members") { 
        if (argc < 3) return 1;
        cout << graph.getCommunityMembersJSON(stoi(argv[2])) << endl;
    }
    else if (command == "send_message") {
        if (argc < 5) return 1;
        string content = argv[4];
        for (int i = 5; i < argc; ++i) content += " " + string(argv[i]);
        graph.addMessage(stoi(argv[2]), stoi(argv[3]), content);
        cout << "{ \"status\": \"sent\" }" << endl;
    }
    else if (command == "search_users") {
        string q = (argc > 2) ? argv[2] : "";
        string t = (argc > 3) ? argv[3] : "All";
        cout << graph.searchUsersJSON(q, t) << endl;
    }
    else if (command == "get_popular") {
        cout << graph.getPopularCommunitiesJSON() << endl;
    }
    else if (command == "get_visual_graph") {
        // THIS IS THE CRITICAL COMMAND FOR THE MAP
        cout << graph.getGraphVisualJSON() << endl;
    }
    else if (command == "vote_message") {
        if (argc < 5) return 1;
        graph.upvoteMessage(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"voted\" }" << endl;
    }
    else if (command == "mod_ban") {
        if (argc < 5) return 1;
        graph.banUser(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"banned\" }" << endl;
    }
    else if (command == "mod_unban") {
        if (argc < 5) return 1;
        graph.unbanUser(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"unbanned\" }" << endl;
    }
    else if (command == "mod_delete") {
        if (argc < 5) return 1;
        graph.deleteMessage(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"deleted\" }" << endl;
    }
    else if (command == "mod_pin") {
        if (argc < 5) return 1;
        graph.pinMessage(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"pinned\" }" << endl;
    }
    else if (command == "mod_promote_admin") {
        if (argc < 5) return 1;
        graph.promoteToAdmin(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"promoted\" }" << endl;
    }
    else if (command == "mod_demote_admin") {
        if (argc < 5) return 1;
        graph.demoteAdmin(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"demoted\" }" << endl;
    }
    else if (command == "mod_transfer") {
        if (argc < 5) return 1;
        graph.transferOwnership(stoi(argv[2]), stoi(argv[3]), stoi(argv[4]));
        cout << "{ \"status\": \"transferred\" }" << endl;
    }
    else {
        cout << "{ \"error\": \"Unknown command: " << command << "\" }" << endl;
    }

    return 0;
}