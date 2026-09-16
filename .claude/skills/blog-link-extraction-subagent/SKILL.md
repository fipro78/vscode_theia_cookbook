---
name: blog-link-extraction-subagent
description: This skill provides a collection of links about VSCode or Theia from blog posts written by Dirk Fauth. Use this when asked for resources about VSCode or Theia, or when asked to find blog posts by Dirk Fauth.
---

# Blog Link Extraction Skill

This skill is designed to extract links from blog posts written by Dirk Fauth about VSCode or Theia. It first collects relevant blog posts from Dirk Fauth's gists and then extracts and filters the links contained within those blog posts to provide a structured list of resources related to VSCode or Theia.

## Process Overview

1. **Define the Extraction Goal**: Identify the specific information to be extracted (e.g., links to blog posts about VSCode or Theia).
2. **Blog Collection**: Fetch a list of relevant blog posts from a specified data source (e.g., GitHub gists).
3. **Link Extraction**: Create one new dynamic extraction subagent for each found blog post and run all extraction subagents in parallel. Each subagent extracts and filters links for exactly one post; then aggregate their results without user interaction to provide a complete result set. Do not select, name, or reuse an existing custom agent for these extractions.
4. **Output**: Provide a structured list grouped by source blog post, with deterministic ordering.

## Execution Rules

1. Run this workflow end-to-end without asking the user for intermediate confirmations.
2. Use `github/list_gists` only to discover gist metadata and identify the selected file. Use `web/fetch` as the only tool for retrieving content, including the publications file and the individual blog pages. Do not use `github/get_gist`.
3. On fetch failures, retry once. If the second attempt fails, continue with remaining items and report the skipped URL in the final output.
4. If fetched content appears truncated, continue with `web/fetch` using its chunking or pagination mechanism. Do not use another retrieval tool or re-fetch already received content merely to process it.
5. For every extraction subagent, create a new dynamic subagent invocation without an `agentName` or other custom-agent selection. Never use an existing custom agent for this workflow.

## Blog Collection

1. List gists for user `fipro78`.
2. Select gist files whose filename contains `publications` (case-insensitive).
3. If multiple matches exist, choose files from the most recently updated gist first.
4. Build the selected file's raw/content URL from the gist metadata and fetch it once with `web/fetch`. Store the returned content as the publications input and process that value directly. If the request fails, retry with `web/fetch` once; do not fall back to `github/get_gist` or another content-retrieval tool.
5. Extract candidate blog post URLs from the stored publications input.
6. Keep only blog posts relevant to the requested topic (default topic: VSCode or Theia). Do not inspect the content of the blog posts themselves at this stage.
7. De-duplicate URLs and produce the final blog post list.

## Link Extraction

1. After the blog post list is finalized and de-duplicated, spawn exactly one new dynamic subagent per blog post. Launch all of these subagents in the same turn so the posts are processed in parallel. The invocations must omit `agentName`; do not route them to an existing custom agent.
2. Give each subagent exactly one assigned blog post URL and the requested topic. The subagent must:
   1. Fetch the assigned blog post; if needed, continue fetching additional chunks until complete.
   2. Retry one fetch failure once. If the retry fails, return the assigned URL as skipped and do not invent links.
   3. Extract outbound links from the blog post.
   4. Exclude non-http(s) links and non-content protocols (`mailto:`, `javascript:`, `tel:`).
   5. Filter links for relevance using topic keywords from surrounding context. For VSCode/Theia, use keywords such as: `vscode`, `visual studio code`, `theia`, `eclipse theia`, `extension`, `webview`, `copilot`.
   6. De-duplicate links within the assigned blog post.
   7. Determine display name for each link:
      - Use anchor text when available.
      - Otherwise use the URL.
   8. Sort links alphabetically by display name within the assigned blog post.
   9. Return a structured result containing the assigned blog post URL, its extracted links, and an optional skipped URL with the fetch failure reason.

3. Aggregate the structured results from all extraction subagents. Preserve the source blog post association, merge no links across posts, and include every skipped URL in the final `Skipped URLs` section.

## Example Workflow

1. A user asks for resources about VSCode or Theia dependent on the user question.
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

- Treat the user's requested topic as an exclusive allowlist. `Visual Studio Code` means Visual Studio Code and its directly related extension, webview, and Copilot APIs; it does not mean Theia unless Theia integration is explicitly requested.
- Treat `VS Code`, `VSCode`, and `Visual Studio Code` as aliases, but do not treat `Theia` as an implicit alias or related topic.
- When a source page discusses multiple technologies, include only links that directly support the requested topic. Mentions of another technology are not sufficient.
- Ensure the final output contains no source post or link that was selected solely because it belongs to a broad mixed-topic category.
- Avoid including duplicate links or links that are not relevant to the topic.
- Provide clear and concise output that is easy to understand and navigate.
- Use the anchor text as the name of the link when available, and use the URL as the name of the link when anchor text is not available.
- Order links alphabetically by name within each blog post section.
- Ensure that the output is structured in a way that clearly indicates which links are associated with which blog posts.
- Include a short `Skipped URLs` section when any blog post could not be fetched after retry.
