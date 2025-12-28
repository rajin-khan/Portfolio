import { R as Redis2 } from '../../chunks/nodejs_B6mB2F9q.mjs';
import { Webhook } from 'svix';
export { r as renderers } from '../../chunks/_@astro-renderers_BUaR2p-v.mjs';

//#region package.json
var version = "6.6.0";

//#endregion
//#region src/common/utils/build-pagination-query.ts
/**
* Builds a query string from pagination options
* @param options - Pagination options containing limit and either after or before (but not both)
* @returns Query string (without leading '?') or empty string if no options
*/
function buildPaginationQuery(options) {
	const searchParams = new URLSearchParams();
	if (options.limit !== void 0) searchParams.set("limit", options.limit.toString());
	if ("after" in options && options.after !== void 0) searchParams.set("after", options.after);
	if ("before" in options && options.before !== void 0) searchParams.set("before", options.before);
	return searchParams.toString();
}

//#endregion
//#region src/api-keys/api-keys.ts
var ApiKeys = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/api-keys", payload, options);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/api-keys?${queryString}` : "/api-keys";
		return await this.resend.get(url);
	}
	async remove(id) {
		return await this.resend.delete(`/api-keys/${id}`);
	}
};

//#endregion
//#region src/common/utils/parse-email-to-api-options.ts
function parseAttachments(attachments) {
	return attachments?.map((attachment) => ({
		content: attachment.content,
		filename: attachment.filename,
		path: attachment.path,
		content_type: attachment.contentType,
		content_id: attachment.contentId
	}));
}
function parseEmailToApiOptions(email) {
	return {
		attachments: parseAttachments(email.attachments),
		bcc: email.bcc,
		cc: email.cc,
		from: email.from,
		headers: email.headers,
		html: email.html,
		reply_to: email.replyTo,
		scheduled_at: email.scheduledAt,
		subject: email.subject,
		tags: email.tags,
		text: email.text,
		to: email.to,
		template: email.template ? {
			id: email.template.id,
			variables: email.template.variables
		} : void 0,
		topic_id: email.topicId
	};
}

//#endregion
//#region src/render.ts
async function render(node) {
	let render$1;
	try {
		({render: render$1} = await import('../../chunks/render_resend_Bs-YE6Qm.mjs'));
	} catch {
		throw new Error("Failed to render React component. Make sure to install `@react-email/render` or `@react-email/components`.");
	}
	return render$1(node);
}

//#endregion
//#region src/batch/batch.ts
var Batch = class {
	constructor(resend) {
		this.resend = resend;
	}
	async send(payload, options) {
		return this.create(payload, options);
	}
	async create(payload, options) {
		const emails = [];
		for (const email of payload) {
			if (email.react) {
				email.html = await render(email.react);
				email.react = void 0;
			}
			emails.push(parseEmailToApiOptions(email));
		}
		return await this.resend.post("/emails/batch", emails, {
			...options,
			headers: {
				"x-batch-validation": options?.batchValidation ?? "strict",
				...options?.headers
			}
		});
	}
};

//#endregion
//#region src/broadcasts/broadcasts.ts
var Broadcasts = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		if (payload.react) payload.html = await render(payload.react);
		return await this.resend.post("/broadcasts", {
			name: payload.name,
			segment_id: payload.segmentId,
			audience_id: payload.audienceId,
			preview_text: payload.previewText,
			from: payload.from,
			html: payload.html,
			reply_to: payload.replyTo,
			subject: payload.subject,
			text: payload.text,
			topic_id: payload.topicId
		}, options);
	}
	async send(id, payload) {
		return await this.resend.post(`/broadcasts/${id}/send`, { scheduled_at: payload?.scheduledAt });
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/broadcasts?${queryString}` : "/broadcasts";
		return await this.resend.get(url);
	}
	async get(id) {
		return await this.resend.get(`/broadcasts/${id}`);
	}
	async remove(id) {
		return await this.resend.delete(`/broadcasts/${id}`);
	}
	async update(id, payload) {
		if (payload.react) payload.html = await render(payload.react);
		return await this.resend.patch(`/broadcasts/${id}`, {
			name: payload.name,
			segment_id: payload.segmentId,
			audience_id: payload.audienceId,
			from: payload.from,
			html: payload.html,
			text: payload.text,
			subject: payload.subject,
			reply_to: payload.replyTo,
			preview_text: payload.previewText,
			topic_id: payload.topicId
		});
	}
};

//#endregion
//#region src/common/utils/parse-contact-properties-to-api-options.ts
function parseContactPropertyFromApi(contactProperty) {
	return {
		id: contactProperty.id,
		key: contactProperty.key,
		createdAt: contactProperty.created_at,
		type: contactProperty.type,
		fallbackValue: contactProperty.fallback_value
	};
}
function parseContactPropertyToApiOptions(contactProperty) {
	if ("key" in contactProperty) return {
		key: contactProperty.key,
		type: contactProperty.type,
		fallback_value: contactProperty.fallbackValue
	};
	return { fallback_value: contactProperty.fallbackValue };
}

//#endregion
//#region src/contact-properties/contact-properties.ts
var ContactProperties = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(options) {
		const apiOptions = parseContactPropertyToApiOptions(options);
		return await this.resend.post("/contact-properties", apiOptions);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/contact-properties?${queryString}` : "/contact-properties";
		const response = await this.resend.get(url);
		if (response.data) return {
			data: {
				...response.data,
				data: response.data.data.map((apiContactProperty) => parseContactPropertyFromApi(apiContactProperty))
			},
			headers: response.headers,
			error: null
		};
		return response;
	}
	async get(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const response = await this.resend.get(`/contact-properties/${id}`);
		if (response.data) return {
			data: {
				object: "contact_property",
				...parseContactPropertyFromApi(response.data)
			},
			headers: response.headers,
			error: null
		};
		return response;
	}
	async update(payload) {
		if (!payload.id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const apiOptions = parseContactPropertyToApiOptions(payload);
		return await this.resend.patch(`/contact-properties/${payload.id}`, apiOptions);
	}
	async remove(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.delete(`/contact-properties/${id}`);
	}
};

//#endregion
//#region src/contacts/segments/contact-segments.ts
var ContactSegments = class {
	constructor(resend) {
		this.resend = resend;
	}
	async list(options) {
		if (!options.contactId && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.contactId;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/contacts/${identifier}/segments?${queryString}` : `/contacts/${identifier}/segments`;
		return await this.resend.get(url);
	}
	async add(options) {
		if (!options.contactId && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.contactId;
		return this.resend.post(`/contacts/${identifier}/segments/${options.segmentId}`);
	}
	async remove(options) {
		if (!options.contactId && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.contactId;
		return this.resend.delete(`/contacts/${identifier}/segments/${options.segmentId}`);
	}
};

//#endregion
//#region src/contacts/topics/contact-topics.ts
var ContactTopics = class {
	constructor(resend) {
		this.resend = resend;
	}
	async update(payload) {
		if (!payload.id && !payload.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = payload.email ? payload.email : payload.id;
		return this.resend.patch(`/contacts/${identifier}/topics`, payload.topics);
	}
	async list(options) {
		if (!options.id && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		const identifier = options.email ? options.email : options.id;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/contacts/${identifier}/topics?${queryString}` : `/contacts/${identifier}/topics`;
		return this.resend.get(url);
	}
};

//#endregion
//#region src/contacts/contacts.ts
var Contacts = class {
	constructor(resend) {
		this.resend = resend;
		this.topics = new ContactTopics(this.resend);
		this.segments = new ContactSegments(this.resend);
	}
	async create(payload, options = {}) {
		if (!payload.audienceId) return await this.resend.post("/contacts", {
			unsubscribed: payload.unsubscribed,
			email: payload.email,
			first_name: payload.firstName,
			last_name: payload.lastName,
			properties: payload.properties
		}, options);
		return await this.resend.post(`/audiences/${payload.audienceId}/contacts`, {
			unsubscribed: payload.unsubscribed,
			email: payload.email,
			first_name: payload.firstName,
			last_name: payload.lastName,
			properties: payload.properties
		}, options);
	}
	async list(options = {}) {
		const segmentId = options.segmentId ?? options.audienceId;
		if (!segmentId) {
			const queryString$1 = buildPaginationQuery(options);
			const url$1 = queryString$1 ? `/contacts?${queryString$1}` : "/contacts";
			return await this.resend.get(url$1);
		}
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/segments/${segmentId}/contacts?${queryString}` : `/segments/${segmentId}/contacts`;
		return await this.resend.get(url);
	}
	async get(options) {
		if (typeof options === "string") return this.resend.get(`/contacts/${options}`);
		if (!options.id && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		if (!options.audienceId) return this.resend.get(`/contacts/${options?.email ? options?.email : options?.id}`);
		return this.resend.get(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`);
	}
	async update(options) {
		if (!options.id && !options.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		if (!options.audienceId) return await this.resend.patch(`/contacts/${options?.email ? options?.email : options?.id}`, {
			unsubscribed: options.unsubscribed,
			first_name: options.firstName,
			last_name: options.lastName,
			properties: options.properties
		});
		return await this.resend.patch(`/audiences/${options.audienceId}/contacts/${options?.email ? options?.email : options?.id}`, {
			unsubscribed: options.unsubscribed,
			first_name: options.firstName,
			last_name: options.lastName,
			properties: options.properties
		});
	}
	async remove(payload) {
		if (typeof payload === "string") return this.resend.delete(`/contacts/${payload}`);
		if (!payload.id && !payload.email) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` or `email` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		if (!payload.audienceId) return this.resend.delete(`/contacts/${payload?.email ? payload?.email : payload?.id}`);
		return this.resend.delete(`/audiences/${payload.audienceId}/contacts/${payload?.email ? payload?.email : payload?.id}`);
	}
};

//#endregion
//#region src/common/utils/parse-domain-to-api-options.ts
function parseDomainToApiOptions(domain) {
	return {
		name: domain.name,
		region: domain.region,
		custom_return_path: domain.customReturnPath,
		capabilities: domain.capabilities,
		open_tracking: domain.openTracking,
		click_tracking: domain.clickTracking,
		tls: domain.tls
	};
}

//#endregion
//#region src/domains/domains.ts
var Domains = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/domains", parseDomainToApiOptions(payload), options);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/domains?${queryString}` : "/domains";
		return await this.resend.get(url);
	}
	async get(id) {
		return await this.resend.get(`/domains/${id}`);
	}
	async update(payload) {
		return await this.resend.patch(`/domains/${payload.id}`, {
			click_tracking: payload.clickTracking,
			open_tracking: payload.openTracking,
			tls: payload.tls,
			capabilities: payload.capabilities
		});
	}
	async remove(id) {
		return await this.resend.delete(`/domains/${id}`);
	}
	async verify(id) {
		return await this.resend.post(`/domains/${id}/verify`);
	}
};

//#endregion
//#region src/emails/attachments/attachments.ts
var Attachments = class {
	constructor(resend) {
		this.resend = resend;
	}
	async get(options) {
		const { emailId, id } = options;
		return await this.resend.get(`/emails/${emailId}/attachments/${id}`);
	}
	async list(options) {
		const { emailId } = options;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails/${emailId}/attachments?${queryString}` : `/emails/${emailId}/attachments`;
		return await this.resend.get(url);
	}
};

//#endregion
//#region src/emails/receiving/attachments/attachments.ts
var Attachments$1 = class {
	constructor(resend) {
		this.resend = resend;
	}
	async get(options) {
		const { emailId, id } = options;
		return await this.resend.get(`/emails/receiving/${emailId}/attachments/${id}`);
	}
	async list(options) {
		const { emailId } = options;
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails/receiving/${emailId}/attachments?${queryString}` : `/emails/receiving/${emailId}/attachments`;
		return await this.resend.get(url);
	}
};

//#endregion
//#region src/emails/receiving/receiving.ts
var Receiving = class {
	constructor(resend) {
		this.resend = resend;
		this.attachments = new Attachments$1(resend);
	}
	async get(id) {
		return await this.resend.get(`/emails/receiving/${id}`);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails/receiving?${queryString}` : "/emails/receiving";
		return await this.resend.get(url);
	}
};

//#endregion
//#region src/emails/emails.ts
var Emails = class {
	constructor(resend) {
		this.resend = resend;
		this.attachments = new Attachments(resend);
		this.receiving = new Receiving(resend);
	}
	async send(payload, options = {}) {
		return this.create(payload, options);
	}
	async create(payload, options = {}) {
		if (payload.react) payload.html = await render(payload.react);
		return await this.resend.post("/emails", parseEmailToApiOptions(payload), options);
	}
	async get(id) {
		return await this.resend.get(`/emails/${id}`);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/emails?${queryString}` : "/emails";
		return await this.resend.get(url);
	}
	async update(payload) {
		return await this.resend.patch(`/emails/${payload.id}`, { scheduled_at: payload.scheduledAt });
	}
	async cancel(id) {
		return await this.resend.post(`/emails/${id}/cancel`);
	}
};

//#endregion
//#region src/segments/segments.ts
var Segments = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/segments", payload, options);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/segments?${queryString}` : "/segments";
		return await this.resend.get(url);
	}
	async get(id) {
		return await this.resend.get(`/segments/${id}`);
	}
	async remove(id) {
		return await this.resend.delete(`/segments/${id}`);
	}
};

//#endregion
//#region src/common/utils/get-pagination-query-properties.ts
function getPaginationQueryProperties(options = {}) {
	const query = new URLSearchParams();
	if (options.before) query.set("before", options.before);
	if (options.after) query.set("after", options.after);
	if (options.limit) query.set("limit", options.limit.toString());
	return query.size > 0 ? `?${query.toString()}` : "";
}

//#endregion
//#region src/common/utils/parse-template-to-api-options.ts
function parseVariables(variables) {
	return variables?.map((variable) => ({
		key: variable.key,
		type: variable.type,
		fallback_value: variable.fallbackValue
	}));
}
function parseTemplateToApiOptions(template) {
	return {
		name: "name" in template ? template.name : void 0,
		subject: template.subject,
		html: template.html,
		text: template.text,
		alias: template.alias,
		from: template.from,
		reply_to: template.replyTo,
		variables: parseVariables(template.variables)
	};
}

//#endregion
//#region src/templates/chainable-template-result.ts
var ChainableTemplateResult = class {
	constructor(promise, publishFn) {
		this.promise = promise;
		this.publishFn = publishFn;
	}
	then(onfulfilled, onrejected) {
		return this.promise.then(onfulfilled, onrejected);
	}
	async publish() {
		const { data, error } = await this.promise;
		if (error) return {
			data: null,
			headers: null,
			error
		};
		return this.publishFn(data.id);
	}
};

//#endregion
//#region src/templates/templates.ts
var Templates = class {
	constructor(resend) {
		this.resend = resend;
	}
	create(payload) {
		return new ChainableTemplateResult(this.performCreate(payload), this.publish.bind(this));
	}
	async performCreate(payload) {
		if (payload.react) {
			if (!this.renderAsync) try {
				const { renderAsync } = await import('../../chunks/render_resend_Bs-YE6Qm.mjs');
				this.renderAsync = renderAsync;
			} catch {
				throw new Error("Failed to render React component. Make sure to install `@react-email/render`");
			}
			payload.html = await this.renderAsync(payload.react);
		}
		return this.resend.post("/templates", parseTemplateToApiOptions(payload));
	}
	async remove(identifier) {
		return await this.resend.delete(`/templates/${identifier}`);
	}
	async get(identifier) {
		return await this.resend.get(`/templates/${identifier}`);
	}
	async list(options = {}) {
		return this.resend.get(`/templates${getPaginationQueryProperties(options)}`);
	}
	duplicate(identifier) {
		return new ChainableTemplateResult(this.resend.post(`/templates/${identifier}/duplicate`), this.publish.bind(this));
	}
	async publish(identifier) {
		return await this.resend.post(`/templates/${identifier}/publish`);
	}
	async update(identifier, payload) {
		return await this.resend.patch(`/templates/${identifier}`, parseTemplateToApiOptions(payload));
	}
};

//#endregion
//#region src/topics/topics.ts
var Topics = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload) {
		const { defaultSubscription, ...body } = payload;
		return await this.resend.post("/topics", {
			...body,
			default_subscription: defaultSubscription
		});
	}
	async list() {
		return await this.resend.get("/topics");
	}
	async get(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.get(`/topics/${id}`);
	}
	async update(payload) {
		if (!payload.id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.patch(`/topics/${payload.id}`, payload);
	}
	async remove(id) {
		if (!id) return {
			data: null,
			headers: null,
			error: {
				message: "Missing `id` field.",
				statusCode: null,
				name: "missing_required_field"
			}
		};
		return await this.resend.delete(`/topics/${id}`);
	}
};

//#endregion
//#region src/webhooks/webhooks.ts
var Webhooks = class {
	constructor(resend) {
		this.resend = resend;
	}
	async create(payload, options = {}) {
		return await this.resend.post("/webhooks", payload, options);
	}
	async get(id) {
		return await this.resend.get(`/webhooks/${id}`);
	}
	async list(options = {}) {
		const queryString = buildPaginationQuery(options);
		const url = queryString ? `/webhooks?${queryString}` : "/webhooks";
		return await this.resend.get(url);
	}
	async update(id, payload) {
		return await this.resend.patch(`/webhooks/${id}`, payload);
	}
	async remove(id) {
		return await this.resend.delete(`/webhooks/${id}`);
	}
	verify(payload) {
		return new Webhook(payload.webhookSecret).verify(payload.payload, {
			"svix-id": payload.headers.id,
			"svix-timestamp": payload.headers.timestamp,
			"svix-signature": payload.headers.signature
		});
	}
};

//#endregion
//#region src/resend.ts
const defaultBaseUrl = "https://api.resend.com";
const defaultUserAgent = `resend-node:${version}`;
const baseUrl = typeof process !== "undefined" && process.env ? process.env.RESEND_BASE_URL || defaultBaseUrl : defaultBaseUrl;
const userAgent = typeof process !== "undefined" && process.env ? process.env.RESEND_USER_AGENT || defaultUserAgent : defaultUserAgent;
var Resend = class {
	constructor(key) {
		this.key = key;
		this.apiKeys = new ApiKeys(this);
		this.segments = new Segments(this);
		this.audiences = this.segments;
		this.batch = new Batch(this);
		this.broadcasts = new Broadcasts(this);
		this.contacts = new Contacts(this);
		this.contactProperties = new ContactProperties(this);
		this.domains = new Domains(this);
		this.emails = new Emails(this);
		this.webhooks = new Webhooks(this);
		this.templates = new Templates(this);
		this.topics = new Topics(this);
		if (!key) {
			if (typeof process !== "undefined" && process.env) this.key = process.env.RESEND_API_KEY;
			if (!this.key) throw new Error("Missing API key. Pass it to the constructor `new Resend(\"re_123\")`");
		}
		this.headers = new Headers({
			Authorization: `Bearer ${this.key}`,
			"User-Agent": userAgent,
			"Content-Type": "application/json"
		});
	}
	async fetchRequest(path, options = {}) {
		try {
			const response = await fetch(`${baseUrl}${path}`, options);
			if (!response.ok) try {
				const rawError = await response.text();
				return {
					data: null,
					error: JSON.parse(rawError),
					headers: Object.fromEntries(response.headers.entries())
				};
			} catch (err) {
				if (err instanceof SyntaxError) return {
					data: null,
					error: {
						name: "application_error",
						statusCode: response.status,
						message: "Internal server error. We are unable to process your request right now, please try again later."
					},
					headers: Object.fromEntries(response.headers.entries())
				};
				const error = {
					message: response.statusText,
					statusCode: response.status,
					name: "application_error"
				};
				if (err instanceof Error) return {
					data: null,
					error: {
						...error,
						message: err.message
					},
					headers: Object.fromEntries(response.headers.entries())
				};
				return {
					data: null,
					error,
					headers: Object.fromEntries(response.headers.entries())
				};
			}
			return {
				data: await response.json(),
				error: null,
				headers: Object.fromEntries(response.headers.entries())
			};
		} catch {
			return {
				data: null,
				error: {
					name: "application_error",
					statusCode: null,
					message: "Unable to fetch data. The request could not be resolved."
				},
				headers: null
			};
		}
	}
	async post(path, entity, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		if (options.idempotencyKey) headers.set("Idempotency-Key", options.idempotencyKey);
		const requestOptions = {
			method: "POST",
			body: JSON.stringify(entity),
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async get(path, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		const requestOptions = {
			method: "GET",
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async put(path, entity, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		const requestOptions = {
			method: "PUT",
			body: JSON.stringify(entity),
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async patch(path, entity, options = {}) {
		const headers = new Headers(this.headers);
		if (options.headers) for (const [key, value] of new Headers(options.headers).entries()) headers.set(key, value);
		const requestOptions = {
			method: "PATCH",
			body: JSON.stringify(entity),
			...options,
			headers
		};
		return this.fetchRequest(path, requestOptions);
	}
	async delete(path, query) {
		const requestOptions = {
			method: "DELETE",
			body: JSON.stringify(query),
			headers: this.headers
		};
		return this.fetchRequest(path, requestOptions);
	}
};

const prerender = false;
let redisUrl = "https://sought-treefrog-40997.upstash.io";
const redisToken = "AaAlAAIncDFhMTE3Mzk3NTE0NmI0YWRlODE2YjRlNzA0MDZjZGU2MHAxNDA5OTc";
if (redisUrl && (redisUrl.startsWith("rediss://") || redisUrl.startsWith("redis://"))) {
  console.warn("⚠️  Redis URL uses redis:// protocol. Upstash REST API requires https://");
  console.warn("Please use the REST API URL from Upstash dashboard (starts with https://)");
  redisUrl = null;
}
if (!redisUrl || !redisToken) {
  console.error("❌ Missing or invalid Redis environment variables");
}
const redis = redisUrl && redisToken && redisUrl.startsWith("https://") ? new Redis2({
  url: redisUrl,
  token: redisToken
}) : null;
const resendApiKey = "re_HaqQ81SH_HAxm1t43jq1bpgteoMLhydDo";
const resend = new Resend(resendApiKey) ;
function getDateFromIssueNumber(issueNumber) {
  const startDate = new Date(2025, 11, 1);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec"
  ];
  const monthOffset = issueNumber - 1;
  const targetDate = new Date(startDate);
  targetDate.setMonth(startDate.getMonth() + monthOffset);
  const month = months[targetDate.getMonth()];
  const year = targetDate.getFullYear();
  const yearShort = year.toString().slice(-2);
  return `${month} ${yearShort}'`;
}
function generateEmailHTML(issueNumber, date, email, siteUrl) {
  const pdfUrl = `${siteUrl}/newsletters/curated-${issueNumber.padStart(3, "0")}.pdf`;
  const unsubscribeUrl = `${siteUrl}/api/unsubscribe?email=${encodeURIComponent(email)}`;
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>curated. #${issueNumber}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital,wght@0,400;0,500;0,600;0,700;1,400;1,500;1,600;1,700&display=swap" rel="stylesheet">
  <link href="https://fonts.cdnfonts.com/css/satoshi" rel="stylesheet">
</head>
<body style="margin: 0; padding: 0; font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif; background-color: #0a0a0a; color: #ffffff;">
  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a;">
    <tr>
      <td style="padding: 40px 20px;">
        <table role="presentation" style="max-width: 600px; margin: 0 auto; background-color: #0a0a0a; border: 1px solid rgba(255, 255, 255, 0.2); border-radius: 24px; overflow: hidden;">
          <!-- Inner container with background -->
          <tr>
            <td style="background-color: #0a0a0a; padding: 3px;">
              <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #0a0a0a; border-radius: 21px; overflow: hidden;">
                <!-- Header with curated. branding -->
                <tr>
                  <td style="padding: 40px 40px 30px; text-align: center;">
                    <div style="font-family: 'Instrument Serif', serif; font-style: italic; font-size: 32px; font-weight: 500; color: #ffffff; margin: 0 0 8px; letter-spacing: -0.5px;">curated.</div>
                    <div style="font-family: 'Satoshi', sans-serif; font-size: 13px; color: rgba(255, 255, 255, 0.6); margin: 0; text-transform: uppercase; letter-spacing: 0.5px;">Issue #${issueNumber} • ${date}</div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding: 0 40px 40px; text-align: center;">
                    <p style="margin: 0 0 20px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.9); font-family: 'Satoshi', sans-serif;">Hey there,</p>
                    
                    <p style="margin: 0 0 30px; font-size: 13px; line-height: 1.6; color: rgba(255, 255, 255, 0.9); font-family: 'Satoshi', sans-serif;">
                      Welcome to the first issue of curated. I won't be sending you new issues every month, just whenever I find cool enough stuff to share.
                      Hope you enjoy the read (and if you don't, you can unsubscribe anytime).
                    </p>
                    
                    <!-- CTA Button -->
                    <table role="presentation" style="width: 100%; margin: 30px 0;">
                      <tr>
                        <td style="text-align: center;">
                          <a href="${pdfUrl}" style="display: inline-block; padding: 12px 28px; background: #ffffff; border: none; color: #0a0a0a; text-decoration: none; border-radius: 12px; font-weight: 400; font-size: 10px; font-family: 'Satoshi', sans-serif; text-transform: uppercase; letter-spacing: 0.5px; transition: all 0.2s ease;">view newsletter</a>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="padding: 30px 40px; background-color: #0a0a0a; border-top: 1px solid rgba(255, 255, 255, 0.1);">
                    <p style="margin: 0 0 12px; font-size: 11px; color: rgba(255, 255, 255, 0.4); text-align: center; font-family: 'Satoshi', sans-serif;">
                      You're receiving this because you subscribed to curated, and have really good taste.
                    </p>
                    <p style="margin: 0; font-size: 11px; text-align: center; font-family: 'Satoshi', sans-serif;">
                      <a href="${unsubscribeUrl}" style="color: rgba(255, 255, 255, 0.5); text-decoration: underline;">unsubscribe</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
        
        <!-- Bottom Spacing -->
        <table role="presentation" style="width: 100%; margin-top: 20px;">
          <tr>
            <td style="text-align: center; padding: 20px;">
              <p style="margin: 0; font-size: 11px; color: rgba(255, 255, 255, 0.3); font-family: 'Satoshi', sans-serif;">
                by <a href="${siteUrl}" style="color: rgba(255, 255, 255, 0.5); text-decoration: none;">rajin khan</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();
}
const POST = async ({ request }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    const adminSecret = authHeader?.replace("Bearer ", "") || authHeader;
    if (!adminSecret || adminSecret !== "003e20e138a3d37f38c025082323f0a565341123afa6bb1de30426d03384d786") {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const { issueNumber } = body || {};
    if (!issueNumber || typeof issueNumber !== "string") {
      return new Response(
        JSON.stringify({ error: "Issue number is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const issueNum = parseInt(issueNumber, 10);
    if (isNaN(issueNum) || issueNum < 1) {
      return new Response(
        JSON.stringify({ error: "Invalid issue number format" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!redis) {
      console.error("Redis not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable: Redis not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!resend) {
      console.error("Resend not configured");
      return new Response(
        JSON.stringify({ error: "Service temporarily unavailable: Resend not configured" }),
        { status: 503, headers: { "Content-Type": "application/json" } }
      );
    }
    const siteUrl = "http://localhost:4321";
    const subscribers = await redis.smembers("newsletter:subscribers");
    const total = subscribers.length;
    if (total === 0) {
      return new Response(
        JSON.stringify({
          success: true,
          sent: 0,
          failed: 0,
          total: 0,
          message: "No subscribers found"
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    const date = getDateFromIssueNumber(issueNum);
    const formattedIssueNumber = issueNumber.padStart(3, "0");
    let sent = 0;
    let failed = 0;
    const errors = [];
    for (const email of subscribers) {
      try {
        const emailHTML = generateEmailHTML(formattedIssueNumber, date, email, siteUrl);
        const fromEmail = "newsletter@rajinkhan.com";
        const result = await resend.emails.send({
          from: `Curated. <${fromEmail}>`,
          to: email,
          subject: `Issue ${formattedIssueNumber}`,
          html: emailHTML
        });
        console.log(`Resend response for ${email}:`, JSON.stringify(result, null, 2));
        if (result.error) {
          failed++;
          const errorMessage = result.error.message || JSON.stringify(result.error);
          errors.push(`${email}: ${errorMessage}`);
          console.error(`Resend error for ${email}:`, result.error);
        } else {
          sent++;
          console.log(`Successfully sent email to ${email}, ID: ${result.data?.id || "unknown"}`);
        }
      } catch (error) {
        failed++;
        const errorMessage = error instanceof Error ? error.message : "Unknown error";
        errors.push(`${email}: ${errorMessage}`);
        console.error(`Failed to send email to ${email}:`, error);
        if (error instanceof Error) {
          console.error("Error stack:", error.stack);
        }
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        sent,
        failed,
        total,
        issueNumber: formattedIssueNumber,
        date,
        ...errors.length > 0 && { errors: errors.slice(0, 10) }
        // Limit errors in response
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error sending newsletter:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to send newsletter",
        details: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	POST,
	prerender
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
