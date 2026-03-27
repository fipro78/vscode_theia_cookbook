---
name: blog-link-extraction
description: This skill provides a collection of links about VSCode or Theia from blog posts written by Dirk Fauth. Use this when asked for resources about VSCode or Theia, or when asked to find blog posts by Dirk Fauth.
---

# Blog Link Extraction Skill

This skill is designed to extract links from blog posts written by Dirk Fauth about VSCode or Theia. It first collects relevant blog posts from Dirk Fauth's gists and then extracts and filters the links contained within those blog posts to provide a structured list of resources related to VSCode or Theia.

## Process Overview

1. **Define the Extraction Goal**: Identify the specific information to be extracted (e.g., links to blog posts about VSCode or Theia).
2. **Blog Collection**: Fetch a list of relevant blog posts from a specified data source (e.g., GitHub gists).
3. **Link Extraction**: For each blog post, extract outbound links and filter them based on relevance to the topic. Perform this step without user interaction to provide a complete result set.
4. **Output**: Provide a structured list grouped by source blog post, with deterministic ordering.

## Execution Rules

1. Run this workflow end-to-end without asking the user for intermediate confirmations.
2. Preferred tools are `github/list_gists` and `web/fetch`. If those exact names are unavailable, use equivalent tools that provide the same capability.
3. On fetch failures, retry once. If the second attempt fails, continue with remaining items and report the skipped URL in the final output.
4. If fetched content appears truncated, fetch additional chunks (for example via start index or pagination) until no additional content is returned.

## Blog Collection

1. List gists for user `fipro78`.
2. Select gist files whose filename contains `publications` (case-insensitive).
3. If multiple matches exist, choose files from the most recently updated gist first.
4. Fetch the selected gist content with max length `25000`; if needed, fetch additional chunks until complete.
5. Extract candidate blog post URLs.
6. Keep only blog posts relevant to the requested topic (default topic: VSCode or Theia).
7. De-duplicate URLs and produce the final blog post list.

## Link Extraction

1. Fetch each blog post with max length `25000`; if needed, continue fetching additional chunks until complete.
2. Extract outbound links from the blog post.
3. Exclude non-http(s) links and non-content protocols (`mailto:`, `javascript:`, `tel:`).
4. Filter links for relevance using topic keywords from surrounding context. For VSCode/Theia, use keywords such as: `vscode`, `visual studio code`, `theia`, `eclipse theia`, `extension`, `webview`, `copilot`.
5. De-duplicate links per blog post.
6. Determine display name for each link:

- Use anchor text when available.
- Otherwise use the URL.

7. Sort links alphabetically by display name within each blog post.

## Example Workflow

1. A user asks for resources about VSCode or Theia.
2. The blog collection process fetches the relevant blog posts from Dirk Fauth's gists.
3. For each relevant blog post, the link extraction process reads the post, extracts outbound links, filters for relevance, and removes duplicates without user interaction.
4. The final output is grouped by blog post, with links presented using anchor text when available, and sorted alphabetically by link name within each blog post.

## Result

The final output is an aggregated collection grouped by blog post. Blog posts are ordered alphabetically by title (or URL if no title is available). Links inside each blog post are ordered alphabetically by link display name.

### Example Result

- [Blog Post 1](http://example.com/blog1):
  - [Link 1](http://example.com/link1) - Anchor Text 1
  - [Link 2](http://example.com/link2) - Anchor Text 2
- [Blog Post 2](http://example.com/blog2):
  - [Link 3](http://example.com/link3) - Anchor Text 3
  - [Link 4](http://example.com/link4) - Anchor Text 4

## Guidelines

- Ensure that the links are relevant to the topic of VSCode or Theia.
- Avoid including duplicate links or links that are not relevant to the topic.
- Provide clear and concise output that is easy to understand and navigate.
- Use the anchor text as the name of the link when available, and use the URL as the name of the link when anchor text is not available.
- Order links alphabetically by name within each blog post section.
- Ensure that the output is structured in a way that clearly indicates which links are associated with which blog posts.
- Include a short `Skipped URLs` section when any blog post could not be fetched after retry.
