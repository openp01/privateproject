import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest<T = any>(
  url: string,
  method: string = "GET",
  data?: unknown | undefined,
): Promise<T> {
  console.log(`Sending ${method} request to ${url}`, data);
  
  const res = await fetch(url, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Important pour envoyer et recevoir des cookies
  });

  console.log(`Response from ${url}:`, res.status, res.statusText);
  
  await throwIfResNotOk(res);
  const responseData = await res.json();
  console.log(`Data from ${url}:`, responseData);
  return responseData;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    console.log(`Sending query request to ${queryKey[0]}`);
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include", // Important pour envoyer et recevoir des cookies
    });
    
    console.log(`Response from query ${queryKey[0]}:`, res.status, res.statusText);

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      console.log(`Unauthorized (401) from ${queryKey[0]}, returning null`);
      return null;
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    console.log(`Data from query ${queryKey[0]}:`, data);
    return data;
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
