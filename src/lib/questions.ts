import { bold, dim, gray, green, underline } from "ansi-colors";
import { prompt } from "enquirer";
import { checkAdapterExistence, checkAuthorName, checkEmail, checkMinSelections, CheckResult, transformAdapterName } from "./actionsAndTransformers";

// Sadly, Enquirer does not export the PromptOptions type
// tslint:disable-next-line:ban-types
type PromptOptions = Exclude<Parameters<typeof prompt>[0], Function | any[]>;
type QuestionAction<T> = (value: T) => Promise<CheckResult>;
// tslint:disable-next-line:interface-over-type-literal
export type AnswerValue = string | boolean | number;
export type Condition = { name: string } & (
	| { value: AnswerValue | AnswerValue[] }
	| { contains: AnswerValue }
);

interface QuestionMeta {
	condition?: Condition;
	resultTransform?: (val: AnswerValue | AnswerValue[]) => AnswerValue | AnswerValue[];
	action?: QuestionAction<AnswerValue | AnswerValue[]>;
}
type Question = PromptOptions & QuestionMeta;

function styledMultiselect<T extends Pick<Question, Exclude<keyof Question, "type">>>(ms: T): T & { type: string } {
	return Object.assign({}, ms, {
		type: "multiselect",
		hint: gray("(<space> to select, <return> to submit)"),
		symbols: {
			indicator: {
				on: green("■"),
				off: dim.gray("□"),
			},
		},
	});
}

const features = [
	{ nodeVersion: 8, message: "String.pad{Start,End}" },
	{ nodeVersion: 8, message: "async/await" },
	{ nodeVersion: 10, message: "Promise.finally" },
	{ nodeVersion: 10, message: "String.trim{Start,End}" },
	{ nodeVersion: 10.8, message: "bigint" },
	{ nodeVersion: 11, message: "Array.flat[Map]" },
];

export const questions: (Question | string)[] = [
	green.bold("Welcome to the ioBroker adapter creator!"),
	"",
	underline("Let's get started with a few questions about your project!"),
	{
		type: "input",
		name: "adapterName",
		message: "Please enter the name of your project:",
		resultTransform: transformAdapterName,
		action: checkAdapterExistence,
	},
	styledMultiselect({
		name: "features",
		message: "Which features should your project contain?",
		initial: [0],
		choices: [
			"Adapter",
			"VIS widget",
		],
		action: checkMinSelections.bind(undefined, "feature", 1),
	}),
	{
		condition: { name: "features", contains: "Adapter" },
		type: "select",
		name: "language",
		message: "Which language do you want to use to code the adapter?",
		choices: [
			"JavaScript",
			"TypeScript",
		],
	},
	styledMultiselect({
		condition: { name: "language", value: "JavaScript" },
		name: "tools",
		message: "Which of the following tools do you want to use?",
		initial: [0, 1],
		choices: [
			{ message: "ESLint", hint: "(recommended)" },
			{ message: "type checking", hint: "(recommended)" },
		],
	}),
	styledMultiselect({
		condition: { name: "language", value: "TypeScript" },
		name: "tools",
		message: "Which of the following tools do you want to use?",
		initial: [0],
		choices: [
			{ message: "TSLint", hint: "(recommended)" },
			{ message: "Code coverage" },
		],
	}),
	// styledMultiselect({
	// 	condition: { name: "features", contains: "Adapter" },
	// 	name: "nodeVersion",
	// 	message: "Which of the following language features do you need?",
	// 	initial: [0, 1, 2, 3],
	// 	choices: features.map(f => f.message),
	// 	resultTransform: (selectedFeatures: string[]) => {
	// 		const nodeVersions = selectedFeatures.map(f => features.find(ff => ff.message === f)!.nodeVersion);
	// 		return Math.max(...nodeVersions);
	// 	},
	// }),
	{
		condition: { name: "features", contains: "Adapter" },
		type: "select",
		name: "adminReact",
		message: "Use React for the Admin UI?",
		initial: "no",
		choices: ["yes", "no"],
	},
	{
		condition: { name: "features", contains: "Adapter" },
		type: "select",
		name: "adminTab",
		message: "Create a tab in the admin UI?",
		initial: "no",
		choices: ["yes", "no"],
	},
	{
		condition: { name: "admin-tab", value: "yes" },
		type: "select",
		name: "tabReact",
		message: "Use React for the tab?",
		initial: "no",
		choices: ["yes", "no"],
	},
	"",
	underline("Almost done! Just a few administrative details..."),
	{
		type: "input",
		name: "authorName",
		message: "Please enter your name (or nickname):",
		action: checkAuthorName,
	},
	{
		type: "input",
		name: "authorGithub",
		message: "What's your name/org on GitHub?",
		initial: (answers: Record<string, any>) => answers.authorName,
		action: checkAuthorName,
	},
	{
		type: "input",
		name: "authorEmail",
		message: "What's your email address?",
		action: checkEmail,
	},
	{
		type: "select",
		name: "license",
		message: "Which license should be used for your project?",
		initial: 5,
		choices: [ // TODO: automate (GH#1)
			"GNU AGPLv3",
			"GNU GPLv3",
			"GNU LGPLv3",
			"Mozilla Public License 2.0",
			"Apache License 2.0",
			"MIT License",
			"The Unlicense",
		],
	},
	"",
	underline("That's it. Please wait a minute while I get this working..."),
];

export interface Answers {
	adapterName: string;
	authorName: string;
	authorEmail: string;
	authorGithub: string;
	description?: string;
	language?: string;
	tools?: string[];
	features: string[];
	title?: string;
	licenseText?: string;
	type?: string;
}
