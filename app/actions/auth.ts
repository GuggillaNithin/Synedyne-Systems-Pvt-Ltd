"use server";

// Helper action to retrieve mock session in case Clerk API is not fully configured
export async function getMockUserSession() {
  return {
    userId: "mock_clerk_admin",
    name: "Meaghan Lownest",
    email: "admin@synedyne.com",
    role: "ADMIN",
    department: "Sales Manager",
    avatarUrl: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=200&auto=format&fit=crop",
  };
}
