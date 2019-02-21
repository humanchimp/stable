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

  describe(".withPlugins()", () => {
    let fork: StablercFile;

    describe("when there are no plugins", () => {
      beforeEach(() => {
        fork = subject.withPlugins();
      });

      it("should be a different instance", () => {
        expect(fork).not.to.equal(subject);
      });

      it("should be an instanceof StablercFile", () => {
        expect(fork).to.be.instanceOf(StablercFile);
      });

      it("should have plugins enabled", () => {
        expect(fork.plugins).to.be.true;
        expect(subject.plugins).to.be.false;
      });

      it("should be an idempotent operation because there is no need to load the plugins again", () => {
        expect(fork.withPlugins()).to.equal(fork);
      });
    });

    describe("when there are plugins", () => {
      beforeEach(() => {
        subject = new StablercFile({
          filename: "",
          document: {
            ...subject.document,
            plugins: [["timing", { timeout: 500 }]],
          },
          plugins: false,
        });
        fork = subject.withPlugins();
      });

      it("should be a different instance", () => {
        expect(fork).not.to.equal(subject);
      });

      it("should be an instanceof StablercFile", () => {
        expect(fork).to.be.instanceOf(StablercFile);
      });

      it("should have plugins enabled", () => {
        expect(fork.plugins).to.be.true;
        expect(subject.plugins).to.be.false;
      });

      it("should be an idempotent operation because there is no need to load the plugins again", () => {
        expect(fork.withPlugins()).to.equal(fork);
      });

      it("should load the plugins asynchronously", async () => {
        const loadedPlugins = await fork.loadedPlugins;

        expect(loadedPlugins).to.be.instanceOf(Map);
      });
    });
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
      filename: ".stablerc",
      document: {
        extends: [],
        include: ["./spec/**/*.spec.{ts,js}"],
        exclude: [],
        plugins: undefined,
        runners: undefined,
      },
      plugins: false,
    });
  });
});

describe("StablercFile.loadAll(filename: string, params: StablercFileLoadParams): Promise<StablercFile[]>", () => {
  it("should load all the .stablerc files it can find by following includes recusively and then finding the nearest .stablerc", async () => {
    const loaded = await loadAll(".stablerc");

    debugger;

    expect([...loaded.entries()]).to.eql([
      [
        ".stablerc",
        {
          filename: ".stablerc",
          document: {
            extends: [],
            include: ["./spec/**/*.spec.{ts,js}"],
            exclude: [],
            plugins: undefined,
            runners: undefined,
          },
          plugins: false,
        },
      ],
      [
        "spec/cli/.stablerc",
        {
          filename: "spec/cli/.stablerc",
          document: {
            extends: ["../.stablerc"],
            include: [],
            exclude: [],
            plugins: undefined,
            runners: ["isolate"],
          },
          plugins: false,
        },
      ],
      [
        "spec/.stablerc",
        {
          filename: "spec/.stablerc",
          document: {
            extends: ["../.stablerc"],
            include: [],
            exclude: [],
            plugins: [["timing", { timeout: 500 }], ["rescue"]],
            runners: undefined,
          },
          plugins: false,
        },
      ],
      [
        "spec/framework/.stablerc",
        {
          filename: "spec/framework/.stablerc",
          document: {
            extends: ["../.stablerc"],
            include: [],
            exclude: [],
            plugins: [["fixture", { include: "./fixture/**/*" }]],
            runners: ["isolate", "headless chrome"],
          },
          plugins: false,
        },
      ],
    ]);
  });
});
