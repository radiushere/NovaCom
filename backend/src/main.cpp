#include "../include/Graph.hpp"
#include <iostream>
#include <string>

// COMMANDS:
// backend.exe add_user <id> <name>
// backend.exe add_friend <id1> <id2>
// backend.exe get_friends <id>

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
        int id = stoi(argv[2]);
        string name = argv[3];
        graph.addUser(id, name);
        graph.saveData();
        cout << "{ \"status\": \"success\", \"message\": \"User added\" }" << endl;
    }
    else if (command == "add_friend") {
        if (argc < 4) return 1;
        int u = stoi(argv[2]);
        int v = stoi(argv[3]);
        graph.addFriendship(u, v);
        graph.saveData();
        cout << "{ \"status\": \"success\", \"message\": \"Friendship added\" }" << endl;
    }
    else if (command == "get_friends") {
        if (argc < 3) return 1;
        int id = stoi(argv[2]);
        cout << graph.getFriendListJSON(id) << endl;
    }
    else {
        cout << "{ \"error\": \"Unknown command\" }" << endl;
    }

    return 0;
}