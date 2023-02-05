import fs from "fs";
import { join } from "path";
import matter from "gray-matter";

import PostType from "../interfaces/post";

import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import {
  DynamoDBDocumentClient,
  GetCommand,
  GetCommandOutput,
  PutCommand,
  PutCommandOutput,
  DeleteCommand,
  DeleteCommandOutput,
  ScanCommand,
  ScanCommandOutput,
} from "@aws-sdk/lib-dynamodb";

const tableName = process.env.DDB_TABLE_NAME;
const ddbClient = new DynamoDBClient({
  credentials: {
    accessKeyId: process.env.DDB_ACCESS_KEY,
    secretAccessKey: process.env.DDB_SECRET_KEY,
  },
  region: process.env.REGION,
});
const marshallOptions = {
  convertEmptyValues: false,
  removeUndefinedValues: true,
  convertClassInstanceToMap: false,
};
const unmarshallOptions = {
  wrapNumbers: false,
};
const translateConfig = { marshallOptions, unmarshallOptions };
const ddbDocClient = DynamoDBDocumentClient.from(ddbClient, translateConfig);

export const getPrompt = (promptId: string): Promise<GetCommandOutput> => {
  return ddbDocClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { id: promptId },
    })
  );
};

export const getPrompts = (promptId: string): Promise<ScanCommandOutput> => {
  return ddbDocClient.send(
    new ScanCommand({
      TableName: tableName,
      ExpressionAttributeValues: { ":type": "prompt" },
      FilterExpression: "contains (type, :type)",
      ProjectionExpression: "id, slug, title, date, excerpt",
    })
  );
};

export const createPrompt = (post: PostType): Promise<PutCommandOutput> => {
  return ddbDocClient.send(
    new PutCommand({
      TableName: tableName,
      // https://docs.aws.amazon.com/amazondynamodb/latest/developerguide/Expressions.OperatorsAndFunctions.html
      ConditionExpression: "attribute_not_exists(id)",
      Item: { ...post, type: "prompt" },
    })
  );
};

export const getPost = (postId: string): Promise<GetCommandOutput> => {
  return ddbDocClient.send(
    new GetCommand({
      TableName: tableName,
      Key: { id: postId },
    })
  );
};

export const getPosts = (postId: string): Promise<ScanCommandOutput> => {
  return ddbDocClient.send(
    new ScanCommand({
      TableName: tableName,
      ExpressionAttributeValues: { ":type": "post" },
      FilterExpression: "contains (type, :type)",
    })
  );
};

export const createPost = (post: PostType): Promise<PutCommandOutput> => {
  return ddbDocClient.send(
    new PutCommand({
      TableName: tableName,
      ConditionExpression: "attribute_not_exists(id)",
      Item: { ...post, type: "post" },
    })
  );
};

export const destroyPost = (postId: string): Promise<DeleteCommandOutput> => {
  return ddbDocClient.send(
    new DeleteCommand({
      TableName: tableName,
      Key: { id: postId },
    })
  );
};

/***************
 * Remove below
 */

const postsDirectory = join(process.cwd(), "_posts");

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export function getPostBySlug(slug: string, fields: string[] = []) {
  const realSlug = slug.replace(/\.md$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.md`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  type Items = {
    [key: string]: string;
  };

  const items: Items = {};

  // Ensure only the minimal needed data is exposed
  fields.forEach((field) => {
    if (field === "slug") {
      items[field] = realSlug;
    }
    if (field === "content") {
      items[field] = content;
    }

    if (typeof data[field] !== "undefined") {
      items[field] = data[field];
    }
  });

  return items;
}

export function getAllPosts(fields: string[] = []) {
  const slugs = getPostSlugs();
  const posts = slugs
    .map((slug) => getPostBySlug(slug, fields))
    // sort posts by date in descending order
    .sort((post1, post2) => (post1.date > post2.date ? -1 : 1));
  return posts;
}
