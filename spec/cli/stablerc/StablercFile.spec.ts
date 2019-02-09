import { expect } from "chai";
import {
  StablercFile,
  splatDocument,
  load,
  loadAll,
} from "../../../src/cli/stablerc/StablercFile";

describe("new StablercFile(document: StablercDocument)", () => {
  let subject: StablercFile;

  beforeEach(() => {
    subject = new StablercFile({
      document: {},
    });
  });

  describe(".document", () => {
    it("should contain the parsed and splatted stablerc document as an object", () => {
      expect(subject.document).to.eql({
        extends: [],
        include: [],
        exclude: [],
        plugins: undefined,
        runners: undefined,
      });
    });
  });

  describe(".plugins", () => {
    it("should contain a boolean reflecting whether or not to load plugins");
  });
});

describe("splatDocument(document: StablercDocument)", () => {
  const base = {
    extends: [],
    include: [],
    exclude: [],
    plugins: undefined,
    runners: undefined,
  };

  it("should splat extends", () => {
    const splatted = {
      ...base,
      extends: [".."],
    };

    expect(
      splatDocument({
        extends: [".."],
      }),
    ).to.eql(splatted);
    expect(
      (splatDocument as any)({
        extends: "..",
      }),
    ).to.eql(splatted);
  });

  it("should splat include", () => {
    const splatted = {
      ...base,
      include: ["**/*.spec"],
    };

    expect(
      splatDocument({
        include: ["**/*.spec"],
      }),
    ).to.eql(splatted);
    expect(
      (splatDocument as any)({
        include: "**/*.spec",
      }),
    ).to.eql(splatted);
  });

  it("should splat exclude", () => {
    const splatted = {
      ...base,
      include: ["**/*.skip.spec"],
    };

    expect(
      splatDocument({
        include: ["**/*.skip.spec"],
      }),
    ).to.eql(splatted);
    expect(
      (splatDocument as any)({
        include: "**/*.skip.spec",
      }),
    ).to.eql(splatted);
  });

  it("should not splat plugins", () => {
    expect(
      splatDocument({
        plugins: undefined,
      }),
    ).to.eql({
      ...base,
      plugins: undefined,
    });
    expect(
      (splatDocument as any)({
        plugins: [],
      }),
    ).to.eql({
      ...base,
      plugins: [],
    });
  });

  it("should not splat runners", () => {
    expect(
      splatDocument({
        runners: undefined,
      }),
    ).to.eql({
      ...base,
      runners: undefined,
    });
    expect(
      (splatDocument as any)({
        runners: [],
      }),
    ).to.eql({
      ...base,
      runners: [],
    });
  });
});

describe("load('.stablerc'): Promise<StablercFile>", () => {
  it("should load the stablerc file from the file system", async () => {
    const loaded: StablercFile = await load(".stablerc");

    expect(loaded).to.eql({
      document: {
        extends: [],
        include: ["./**/*.spec.{ts,js}"],
        exclude: [],
        plugins: undefined,
        runners: undefined,
      },
    });
  });
});

describe("StablercFile.loadAll(filename: string, params: StablercFileLoadParams): Promise<StablercFile[]>", () => {
  it("should load all the .stablerc files it can find by following includes recusively and then finding the nearest .stablerc", async () => {
    const loaded = await loadAll(".stablerc");

    expect([...loaded.entries()]).to.eql([
      [
        ".stablerc",
        {
          document: {
            extends: [],
            include: ["./**/*.spec.{ts,js}"],
            exclude: [],
            plugins: undefined,
            runners: undefined,
          },
        },
      ],
      [
        "spec/cli/.stablerc",
        {
          document: {
            extends: ["../.stablerc"],
            include: [],
            exclude: [],
            plugins: undefined,
            runners: ["isolate"],
          },
        },
      ],
      [
        "spec/.stablerc",
        {
          document: {
            extends: [],
            include: [],
            exclude: [],
            plugins: [
              ["timing", { timeout: 200 }],
              ["rescue"],
              ["fixture", { include: "./fixture/**/*" }],
            ],
            runners: undefined,
          },
        },
      ],
      [
        "spec/framework/.stablerc",
        {
          document: {
            extends: ["../.stablerc"],
            include: [],
            exclude: [],
            plugins: undefined,
            runners: ["isolate", "headless chrome"],
          },
        },
      ],
    ]);
  });
});
