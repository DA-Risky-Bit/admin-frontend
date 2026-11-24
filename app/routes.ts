import { type RouteConfig, index, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("docker", "routes/containers.tsx"),
  route("users", "routes/users.tsx"),
] satisfies RouteConfig;
