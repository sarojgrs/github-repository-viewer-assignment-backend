import { FastifyInstance } from "fastify";
import { per_page } from "../config/config";
import { IUserModal } from "../modal/IUserModal";
import { IRepoModal } from "../modal/IRepoModal";
import { get } from "../apiLibrary/apiLibrary";
import { REPO_TYPES } from "../constants/repositoryType";
import { CustomError } from "../customError/customError";

const GITHUB_PERSONAL_ACCESS_TOKEN = process.env.GITHUB_PERSONAL_ACCESS_TOKEN;

export default async function (fastify: FastifyInstance) {
  //   Get the user profile
  fastify.get("/api/profile", async (request, reply) => {
    const { username, selectedRepoType }: any = request.query;
    try {
      if (!GITHUB_PERSONAL_ACCESS_TOKEN) {
        throw new CustomError("Git hub personal api not found..", 400);
      }

      let url = `/users/${username}`; //public
      if (selectedRepoType === REPO_TYPES.PRIVATE) url = `/user`; //private ;

      const response = await get<IUserModal>(url, {
        username,
      });

      // If the authentication is successful, later can handle the user session or generate a token
      // ... logic for handling the authenticated user ...
      reply.send({ success: true, data: response });
    } catch (error: any) {
      handleErrors(error, reply);
    }
  });

  fastify.get("/api/repositories", async (request, reply) => {
    try {
      const { username, page, selectedRepoType }: any = request.query;
      let repositories: IRepoModal[] = [];

      let url = `/users/${username}/repos`; //public
      if (selectedRepoType === REPO_TYPES.PRIVATE)
        url = `user/repos?type=private`; //private ;

      const response = await get<IRepoModal[]>(url, {
        page: page,
        per_page: per_page, // Adjust per_page as needed
      });

      repositories = response.map((repo: IRepoModal) => ({
        id: repo.id,
        name: repo.name,
        description: repo.description,
        html_url: repo.html_url,
        stargazers_count: repo.stargazers_count,
        forks_count: repo.forks_count,
        language: repo.language,
        //  add more repository details here
      }));

      reply.send({ success: true, data: repositories });
    } catch (error: any) {
      handleErrors(error, reply);
    }
  });

  fastify.get("/api/getTotalReposCount", async (request, reply) => {
    const { username, selectedRepoType }: any = request.query;
    try {
      let url = `/users/${username}/repos`; //public
      if (selectedRepoType === REPO_TYPES.PRIVATE)
        url = `user/repos?type=private`; //private ;

      // Make a request to the GitHub API
      const response = await get<IRepoModal[]>(url, {
        page: 1,
        per_page: 1000, // need to take whole amount because github api give only 30 if we get all..
      });

      // Retrieve the total number of repositories from the response headers
      const totalCount = response.length;

      // Log or return the total count
      console.log("Total Repositories:", totalCount);
      reply.send({
        success: true,
        data: totalCount,
      });
    } catch (error: any) {
      handleErrors(error, reply);
    }
  });
}

function handleErrors(error: CustomError, reply: any) {
  const err: any = error;

  let errorStatusCode = 500;
  if (error instanceof CustomError) {
    errorStatusCode = error.statusCode;
  } else {
    errorStatusCode = err.request.res.statusCode;
  }
  // Handle specific errors if needed
  if (errorStatusCode === 404) {
    reply.status(errorStatusCode).send({ error: "User Not Found" });
  } else if (errorStatusCode === 401) {
    reply.status(errorStatusCode).send({ error: "Authentication failed" });
  } else if (errorStatusCode === 500) {
    reply.status(errorStatusCode).send({ error: "Internal Server Error" });
  } else {
    reply.status(errorStatusCode).send({ error: error.message });
  }
}
