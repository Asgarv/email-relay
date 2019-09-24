
const template: any = {
    RELAY_ADDRESS_PREFIX: { required: false, default: '<' },
    RELAY_ADDRESS_SUFFIX: { required: false, default: '>' },
    RELAY_EMAIL_ADDRESS: { required: true },
    RELAY_FROM_ADDRESS: { required: true },
    RELAY_PATH: { required: false, default: '/go' },
    RELAY_PORT: { required: true },
    RELAY_SENDGRID_KEY: { required: true },
    RELAY_TEMP_ATTACHMENT_PATH: { required: true },
};

/**
 * Verifies the required environment variables.
 * Throws an error if any required variables are missing.
 *
 * @return {void}
 */
export function verify(): void {
    const errors: string[] = [];

    for (const [key, obj] of Object.entries(template)) {
        const ob: any = obj;
        if (ob.required) {
            if (!process.env[key]) {
                errors.push(key);
            }
        }
    }

    if (errors.length > 0) {
        throw new Error(
            `\n\nThe following required environment variables are not set:
            ${errors.map((err: string) => `\n- ${err}`)}
            `.replace(',', ''));
    }
}

/**
 * Returns value of environment variable named v.
 * If value is undefined, the default value will be returned instead.
 *
 * @param {string} v
 * @return {any}
 */
export function get(v: string): any {
    return process.env[v] || template[v].default || null;
}
