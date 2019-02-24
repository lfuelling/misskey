import endpoints from '../endpoints';
import { Context } from 'cafy';
import config from '../../../config';
import { errors as basicErrors } from './errors';
import { schemas } from './schemas';
import { description } from './description';
import { convertOpenApiSchema } from '../../../prelude/schema';

export function genOpenapiSpec(lang = 'ja-JP') {
	const spec = {
		openapi: '3.0.0',

		info: {
			version: 'v1',
			title: 'Misskey API',
			description: '**Misskey is a decentralized microblogging platform.**\n\n' + description,
			'x-logo': { url: '/assets/api-doc.png' }
		},

		externalDocs: {
			description: 'Repository',
			url: 'https://github.com/syuilo/misskey'
		},

		servers: [{
			url: config.api_url
		}],

		paths: {} as any,

		components: {
			schemas: schemas,

			securitySchemes: {
				ApiKeyAuth: {
					type: 'apiKey',
					in: 'body',
					name: 'i'
				}
			}
		}
	};

	function genProps(props: { [key: string]: Context & { desc: any, default: any }; }) {
		const properties = {} as any;

		const kvs = Object.entries(props);

		for (const kv of kvs) {
			properties[kv[0]] = genProp(kv[1], kv[1].desc, kv[1].default);
		}

		return properties;
	}

	function genProp(param: Context, desc?: string, _default?: any): any {
		const required = param.name === 'Object' ? (param as any).props ? Object.entries((param as any).props).filter(([k, v]: any) => !v.isOptional).map(([k, v]) => k) : [] : [];
		return {
			description: desc,
			default: _default,
			...(_default ? { default: _default } : {}),
			type: param.name === 'ID' ? 'string' : param.name.toLowerCase(),
			...(param.name === 'ID' ? { example: 'xxxxxxxxxxxxxxxxxxxxxxxx', format: 'id' } : {}),
			nullable: param.isNullable,
			...(param.name === 'String' ? {
				...((param as any).enum ? { enum: (param as any).enum } : {}),
				...((param as any).minLength ? { minLength: (param as any).minLength } : {}),
				...((param as any).maxLength ? { maxLength: (param as any).maxLength } : {}),
			} : {}),
			...(param.name === 'Number' ? {
				...((param as any).minimum ? { minimum: (param as any).minimum } : {}),
				...((param as any).maximum ? { maximum: (param as any).maximum } : {}),
			} : {}),
			...(param.name === 'Object' ? {
				...(required.length > 0 ? { required } : {}),
				properties: (param as any).props ? genProps((param as any).props) : {}
			} : {}),
			...(param.name === 'Array' ? {
				items: (param as any).ctx ? genProp((param as any).ctx) : {}
			} : {})
		};
	}

	for (const endpoint of endpoints.filter(ep => !ep.meta.secure)) {
		const porops = {} as any;
		const errors = {} as any;

		if (endpoint.meta.errors) {
			for (const e of Object.values(endpoint.meta.errors)) {
				errors[e.code] = {
					value: {
						error: e
					}
				};
			}
		}

		if (endpoint.meta.params) {
			for (const kv of Object.entries(endpoint.meta.params)) {
				if (kv[1].desc) (kv[1].validator as any).desc = kv[1].desc[lang];
				if (kv[1].default) (kv[1].validator as any).default = kv[1].default;
				porops[kv[0]] = kv[1].validator;
			}
		}

		const required = endpoint.meta.params ? Object.entries(endpoint.meta.params).filter(([k, v]) => !v.validator.isOptional).map(([k, v]) => k) : [];

		const resSchema = endpoint.meta.res ? convertOpenApiSchema(endpoint.meta.res) : {};

		const info = {
			operationId: endpoint.name,
			summary: endpoint.name,
			description: endpoint.meta.desc ? endpoint.meta.desc[lang] : 'No description provided.',
			externalDocs: {
				description: 'Source code',
				url: `https://github.com/syuilo/misskey/blob/develop/src/server/api/endpoints/${endpoint.name}.ts`
			},
			...(endpoint.meta.tags ? {
				tags: endpoint.meta.tags
			} : {}),
			...(endpoint.meta.requireCredential ? {
				security: [{
					ApiKeyAuth: []
				}]
			} : {}),
			requestBody: {
				required: true,
				content: {
					'application/json': {
						schema: {
							type: 'object',
							...(required.length > 0 ? { required } : {}),
							properties: endpoint.meta.params ? genProps(porops) : {}
						}
					}
				}
			},
			responses: {
				...(endpoint.meta.res ? {
					'200': {
						description: 'OK (with results)',
						content: {
							'application/json': {
								schema: resSchema
							}
						}
					}
				} : {
					'204': {
						description: 'OK (without any results)',
					}
				}),
				'400': {
					description: 'Client error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: { ...errors, ...basicErrors['400'] }
						}
					}
				},
				'401': {
					description: 'Authentication error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: basicErrors['401']
						}
					}
				},
				'403': {
					description: 'Forbiddon error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: basicErrors['403']
						}
					}
				},
				'418': {
					description: 'I\'m Ai',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: basicErrors['418']
						}
					}
				},
				...(endpoint.meta.limit ? {
					'429': {
						description: 'To many requests',
						content: {
							'application/json': {
								schema: {
									$ref: '#/components/schemas/Error'
								},
								examples: basicErrors['429']
							}
						}
					}
				} : {}),
				'500': {
					description: 'Internal server error',
					content: {
						'application/json': {
							schema: {
								$ref: '#/components/schemas/Error'
							},
							examples: basicErrors['500']
						}
					}
				},
			}
		};

		spec.paths['/' + endpoint.name] = {
			post: info
		};
	}

	return spec;
}