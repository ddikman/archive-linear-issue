#!/usr/bin/env node

import { parseArgs } from "node:util";

const LINEAR_API_URL = "https://api.linear.app/graphql";

const LOOKUP_QUERY = `
query GetIssue($identifier: String!) {
    issue(id: $identifier) {
        id
        identifier
        title
    }
}
`;

const ARCHIVE_MUTATION = `
mutation ArchiveIssue($id: String!) {
    issueArchive(id: $id) {
        success
    }
}
`;

async function gql(query, variables, apiKey) {
  const resp = await fetch(LINEAR_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: apiKey,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!resp.ok) {
    const body = await resp.text();
    console.error(`HTTP ${resp.status} ${resp.statusText}`);
    console.error(`Response body: ${body}`);
    process.exit(1);
  }
  return resp.json();
}

async function resolveUuid(identifier, apiKey) {
  const data = await gql(LOOKUP_QUERY, { identifier }, apiKey);
  if (data.errors) {
    for (const err of data.errors) {
      console.error(`Lookup error: ${err.message ?? JSON.stringify(err)}`);
    }
    process.exit(1);
  }
  const issue = data?.data?.issue;
  if (!issue) {
    console.error(`Issue '${identifier}' not found.`);
    process.exit(1);
  }
  return [issue.id, issue.title];
}

async function archive(uuid, apiKey) {
  const data = await gql(ARCHIVE_MUTATION, { id: uuid }, apiKey);
  if (data.errors) {
    for (const err of data.errors) {
      console.error(`  Error: ${err.message ?? JSON.stringify(err)}`);
    }
    return false;
  }
  return data?.data?.issueArchive?.success ?? false;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const USAGE = "usage: archive-linear-issue --api-key lin_api_xxx ENG-1 ENG-2 ENG-3";

async function main() {
  let values, positionals;
  try {
    ({ values, positionals } = parseArgs({
      options: {
        "api-key": { type: "string" },
      },
      allowPositionals: true,
    }));
  } catch (e) {
    console.error(`error: ${e.message}`);
    console.error(USAGE);
    process.exit(2);
  }

  const apiKey = (values["api-key"] ?? process.env.LINEAR_API_KEY)?.trim();
  if (!apiKey) {
    console.error("error: --api-key flag or LINEAR_API_KEY env var is required");
    console.error(USAGE);
    process.exit(2);
  }
  if (positionals.length === 0) {
    console.error("error: at least one issue identifier is required");
    console.error(USAGE);
    process.exit(2);
  }

  let ok = 0;
  let fail = 0;

  for (const issueId of positionals) {
    let uuid, title;
    // UUIDs have exactly 4 dashes (8-4-4-4-12); identifiers like ENG-1 have 1.
    if ((issueId.match(/-/g) || []).length !== 4) {
      [uuid, title] = await resolveUuid(issueId, apiKey);
    } else {
      uuid = issueId;
      title = issueId;
    }

    if (await archive(uuid, apiKey)) {
      console.log(`✓ ${issueId} — ${title}`);
      ok += 1;
    } else {
      console.log(`✗ ${issueId} — failed`);
      fail += 1;
    }

    await sleep(50);
  }

  console.log(`\n${ok} archived, ${fail} failed`);
}

main();
