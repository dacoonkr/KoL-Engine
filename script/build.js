function parse() {
  let codeline = document.getElementsByClassName("before")[0].value.split("\n");
  document.getElementsByClassName("after")[0].innerHTML = "";
  let lastIndentCount = 0;
  let indentDepth = 0;
  for (let i = 0; i < codeline.length; i++) {
    //codeline[i] = codeline[i].trim();
    if (codeline[i].length === 0) continue;

    let parsed = parseline(codeline[i]);
    let builded = build_javascript(parsed);

    let indentCountTmp = indentCount(codeline[i]);

    if (lastIndentCount > indentCountTmp) {
      indentDepth--;
      document.getElementsByClassName(
        "after"
      )[0].innerHTML += `${"&nbsp".repeat(indentDepth * 4)}}\n${"&nbsp".repeat(
        indentDepth * 4
      )}${builded}\n`;
    } else if (indentCountTmp > lastIndentCount) {
      indentDepth++;
      document.getElementsByClassName(
        "after"
      )[0].innerHTML += `${"&nbsp".repeat(
        indentDepth * 4 - 4
      )}{\n${"&nbsp".repeat(indentDepth * 4)}${builded}\n`;
    } else {
      document.getElementsByClassName(
        "after"
      )[0].innerHTML += `${"&nbsp".repeat(indentDepth * 4)}${builded}\n`;
    }
    lastIndentCount = indentCountTmp;
  }
}

function parseline(codeline) {
  let parsed = {};

  let chunks = codeline.split(" ");
  for (let i = 0; i < chunks.length; i++) {
    let purpose = find_purpose_josa(chunks[i]);
    if (purpose[0] === "단어") {
      parsed["단어"] = new word(chunks[i]);
    } else {
      parsed[purpose[0]] = new chunk(parseline(purpose[1]));
    }
  }

  return parsed;
}

function find_purpose_josa(content) {
  if (content.startsWith("?"))
    return ["목적어", content.substring(1, content.length)];

  if (content.endsWith("를") || content.endsWith("을"))
    return ["목적어", content.substring(0, content.length - 1)];

  if (content.endsWith("으로"))
    return ["부사어-결과", content.substring(0, content.length - 2)];
  if (content.endsWith("로"))
    return ["부사어-결과", content.substring(0, content.length - 1)];

  if (content.endsWith("부터"))
    return ["부사어-범위시작", content.substring(0, content.length - 2)];
  if (content.endsWith("까지"))
    return ["부사어-범위종료", content.substring(0, content.length - 2)];

  if (content.endsWith("인동안"))
    return ["조건반복식", content.substring(0, content.length - 3)];
  if (content.endsWith("동안"))
    return ["조건반복식", content.substring(0, content.length - 2)];
  if (content.endsWith("라면"))
    return ["조건식", content.substring(0, content.length - 2)];
  if (content.endsWith("면"))
    return ["조건식", content.substring(0, content.length - 1)];

  if (content.endsWith("에"))
    return ["부사어-대입", content.substring(0, content.length - 1)];

  if (
    content.endsWith("이") ||
    content.endsWith("가") ||
    content.endsWith("에")
  )
    return ["주어", content.substring(0, content.length - 1)];

  return ["단어", ""];
}

let constant_names = {
  주어: {
    콘솔: "console"
  },
  서술어: {
    콘솔: {
      로그: "log"
    }
  }
};

function build_javascript(parsed) {
  let builded = "";

  if (parsed.hasOwnProperty("주어")) {
    let content = build_javascript(parsed["주어"].content);

    if (constant_names["주어"].hasOwnProperty(content)) {
      content = constant_names["주어"][content];
    }
    builded += `${content}.`;
  }
  if (parsed.hasOwnProperty("단어")) {
    let content = parsed["단어"].content;

    if (parsed.hasOwnProperty("주어")) {
      let subcontent = build_javascript(parsed["주어"].content);
      if (constant_names["서술어"].hasOwnProperty(subcontent)) {
        if (constant_names["서술어"][subcontent].hasOwnProperty(content))
          content = constant_names["서술어"][subcontent][content];
      }
    }

    if (parsed["단어"].content === "정의") {
      builded += `let ${build_javascript(parsed["목적어"].content)}`;
      if (parsed.hasOwnProperty("부사어-결과")) {
        builded += ` = ${build_javascript(parsed["부사어-결과"].content)}`;
      }
      return builded;
    }
    if (parsed["단어"].content === "대입") {
      builded += `${build_javascript(parsed["부사어-대입"].content)}`;
      if (parsed.hasOwnProperty("부사어-대입")) {
        builded += ` = ${build_javascript(parsed["목적어"].content)}`;
      }
      return builded;
    }
    if (parsed["단어"].content === "반복") {
      if (parsed.hasOwnProperty("조건반복식")) {
        builded += `while (${build_javascript(parsed["조건반복식"].content)})`;
        return builded;
      } else {
        let item = build_javascript(parsed["목적어"].content);
        builded += `for (let ${item} = `;
        if (
          parsed.hasOwnProperty("부사어-범위시작") &&
          parsed.hasOwnProperty("부사어-범위종료")
        ) {
          builded += `${build_javascript(
            parsed["부사어-범위시작"].content
          )}; ${item} < `;
          builded += `${build_javascript(parsed["부사어-범위종료"].content)}; `;
          builded += `${item}++)`;
        }
        return builded;
      }
    }
    if (parsed["단어"].content === "만약") {
      builded += `if (${build_javascript(parsed["조건식"].content)})`;
      return builded;
    }
    if (parsed["단어"].content === "빠지기") {
      builded += `break`;
      return builded;
    }
    builded += content;
  }
  if (parsed.hasOwnProperty("목적어")) {
    let content = build_javascript(parsed["목적어"].content);

    builded += `(${content})`;
  }

  return builded;
}

function indentCount(content) {
  let indentCountTmp = 0;
  while (content[indentCountTmp] === " ") indentCountTmp++;

  return indentCountTmp;
}

class word {
  constructor(content) {
    this.content = content;
  }
}

class chunk {
  constructor(content) {
    this.content = content;
  }
}

function cls() {
  console.clear();
}
