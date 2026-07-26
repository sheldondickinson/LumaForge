import "dotenv/config";

import { stdin, stdout } from "node:process";
import { closeDatabaseConnection } from "@/db/client";
import {
  AdministratorAlreadyExistsError,
  createFirstAdministrator,
} from "@/lib/auth/service";

function readArguments(arguments_: string[]) {
  let email: string | undefined;
  let passwordFromStandardInput = false;

  for (let index = 0; index < arguments_.length; index += 1) {
    const argument = arguments_[index];

    if (argument === "--email") {
      email = arguments_[index + 1];
      index += 1;
    } else if (argument === "--password-stdin") {
      passwordFromStandardInput = true;
    } else {
      throw new Error(`Unknown argument: ${argument}`);
    }
  }

  if (!email) {
    throw new Error("--email is required.");
  }

  return { email, passwordFromStandardInput };
}

async function readPasswordFromStandardInput() {
  let value = "";
  for await (const chunk of stdin) {
    value += chunk.toString();
  }
  return value.replace(/\r?\n$/, "");
}

async function readHiddenPassword(prompt: string) {
  if (!stdin.isTTY || typeof stdin.setRawMode !== "function") {
    throw new Error(
      "An interactive terminal is required. Use --password-stdin for automation.",
    );
  }

  stdout.write(prompt);
  stdin.setRawMode(true);
  stdin.resume();

  return new Promise<string>((resolve, reject) => {
    let password = "";

    function restoreTerminal() {
      stdin.setRawMode(false);
      stdin.pause();
      stdin.off("data", onData);
      stdout.write("\n");
    }

    function onData(chunk: Buffer) {
      const input = chunk.toString("utf8");

      if (input === "\u0003") {
        restoreTerminal();
        reject(new Error("Administrator creation cancelled."));
        return;
      }

      if (input === "\r" || input === "\n") {
        restoreTerminal();
        resolve(password);
        return;
      }

      if (input === "\u007f") {
        password = password.slice(0, -1);
        return;
      }

      password += input;
    }

    stdin.on("data", onData);
  });
}

const { email, passwordFromStandardInput } = readArguments(
  process.argv.slice(2),
);
let password: string;

if (passwordFromStandardInput) {
  password = await readPasswordFromStandardInput();
} else {
  password = await readHiddenPassword("Administrator password: ");
  const confirmation = await readHiddenPassword(
    "Confirm administrator password: ",
  );

  if (password !== confirmation) {
    throw new Error("The password confirmation did not match.");
  }
}

try {
  const user = await createFirstAdministrator({ email, password });
  console.info(`Administrator created for ${user.email}.`);
} catch (error) {
  if (error instanceof AdministratorAlreadyExistsError) {
    console.error(error.message);
    process.exitCode = 2;
  } else {
    throw error;
  }
} finally {
  await closeDatabaseConnection();
}
