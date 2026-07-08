import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Simple shared password so evaluators can log in as any role instantly.
const DEMO_PASSWORD = "password";

const DEMO_USERS = [
  { email: "alice@demo.dev", name: "Alice" },
  { email: "bob@demo.dev", name: "Bob" },
  { email: "carol@demo.dev", name: "Carol" },
];

async function main() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 10);

  const [alice, bob, carol] = await Promise.all(
    DEMO_USERS.map((u) =>
      prisma.user.upsert({
        where: { email: u.email },
        update: { name: u.name },
        create: { email: u.email, name: u.name, passwordHash },
      }),
    ),
  );

  // A shared sample document that demonstrates all three roles at once.
  const doc = await prisma.document.upsert({
    where: { id: "demo-doc-0001" },
    update: {},
    create: { id: "demo-doc-0001", title: "Welcome to Local-First Docs" },
  });

  const grants: Array<[string, Role]> = [
    [alice.id, Role.OWNER],
    [bob.id, Role.EDITOR],
    [carol.id, Role.VIEWER],
  ];

  await Promise.all(
    grants.map(([userId, role]) =>
      prisma.documentAccess.upsert({
        where: { documentId_userId: { documentId: doc.id, userId } },
        update: { role },
        create: { documentId: doc.id, userId, role },
      }),
    ),
  );

  console.log("Seeded demo users (password: %s):", DEMO_PASSWORD);
  console.log("  alice@demo.dev  → OWNER");
  console.log("  bob@demo.dev    → EDITOR");
  console.log("  carol@demo.dev  → VIEWER");
  console.log('Seeded shared document "%s" (%s)', doc.title, doc.id);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
