#pragma once
#include <string>
#include <vector>
#include <unordered_set>
#include <set>

using namespace std;

struct User {
    int id;
    string name;
    vector<string> interests;
    unordered_set<int> joinedCommunities; // IDs of communities
};