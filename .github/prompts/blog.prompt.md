---
agent: agent
tools: [agent, web/fetch, github/get_gist, github/list_gists]
---

1. List the gists of the user fipro78 by using #tool:github/list_gists to find the gist that contains information about blog posts.
2. Fetch the publications of Dirk Fauth in the gist with blog posts of fipro78 by using #tool:github/get_gist
3. Fetch the content of the gist with a max-length parameter of 15000 by using #tool:web/fetch
4. Filter the found links for information about VS Code or Theia
5. Provide a list of links to the blog posts about VS Code or Theia
6. Handoff the list of links to the filewriter subagent via #tool:agent/runSubagent to persist them in a file named fauth.html in the links folder.
