// server/utils/claudeApiHelper.js - SMART CLAUDE API WRAPPER WITH RETRY
class ClaudeApiHelper {
    constructor() {
        this.baseUrl = 'https://api.anthropic.com/v1/messages';
        this.apiKey = process.env.ANTHROPIC_API_KEY;
        this.defaultMaxRetries = 5;
        this.baseDelay = 2000; // 2 seconds
        this.maxDelay = 30000; // 30 seconds

        // Rate limiting
        this.lastRequestTime = 0;
        this.minTimeBetweenRequests = 500; // 500ms between requests
    }

    calculateBackoff(attempt, baseDelay = this.baseDelay) {
        const delay = Math.min(baseDelay * Math.pow(2, attempt), this.maxDelay);
        const jitter = Math.random() * 1000;
        return delay + jitter;
    }

    async wait(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    isRetryableError(statusCode) {
        return [429, 500, 502, 503, 504, 529].includes(statusCode);
    }

    async makeRequest(params, options = {}) {
        const {
            maxRetries = this.defaultMaxRetries,
            timeout = 90000,
            onRetry = null
        } = options;

        console.log('🤖 Claude API Request:', {
            model: params.model,
            maxTokens: params.max_tokens,
            maxRetries
        });

        let lastError = null;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                // Rate limiting
                const now = Date.now();
                const timeSinceLastRequest = now - this.lastRequestTime;
                if (timeSinceLastRequest < this.minTimeBetweenRequests) {
                    const waitTime = this.minTimeBetweenRequests - timeSinceLastRequest;
                    await this.wait(waitTime);
                }

                if (attempt > 0) {
                    const backoffDelay = this.calculateBackoff(attempt - 1);
                    console.log(`   🔄 Retry ${attempt}/${maxRetries} after ${Math.round(backoffDelay)}ms`);

                    if (onRetry) {
                        onRetry(attempt, maxRetries, backoffDelay);
                    }

                    await this.wait(backoffDelay);
                }

                this.lastRequestTime = Date.now();

                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), timeout);

                const response = await fetch(this.baseUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'x-api-key': this.apiKey,
                        'anthropic-version': '2023-06-01'
                    },
                    body: JSON.stringify(params),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                const data = await response.json();

                if (response.ok) {
                    console.log(`   ✅ Success after ${attempt + 1} attempt(s)`);
                    return {
                        success: true,
                        data: data,
                        text: data.content[0].text,
                        attempts: attempt + 1
                    };
                }

                if (!this.isRetryableError(response.status)) {
                    console.error(`   ❌ Non-retryable error: ${response.status}`);
                    throw new Error(`API Error ${response.status}: ${data.error?.message || 'Unknown error'}`);
                }

                lastError = new Error(`API Error ${response.status}: ${data.error?.message || 'Unknown error'}`);
                console.log(`   ⚠️  Retryable error ${response.status}: ${data.error?.message}`);

                if (response.status === 429) {
                    const retryAfter = response.headers.get('retry-after');
                    if (retryAfter) {
                        const waitTime = parseInt(retryAfter) * 1000;
                        console.log(`   ⏸️  Rate limit - waiting ${waitTime}ms`);
                        await this.wait(waitTime);
                    }
                }

            } catch (error) {
                if (error.name === 'AbortError') {
                    lastError = new Error(`Request timeout after ${timeout}ms`);
                    console.log(`   ⏱️  Timeout on attempt ${attempt + 1}`);
                } else {
                    lastError = error;
                    console.error(`   ❌ Error on attempt ${attempt + 1}:`, error.message);
                }

                if (attempt === maxRetries) {
                    break;
                }
            }
        }

        console.error(`   ❌ All ${maxRetries + 1} attempts failed`);
        return {
            success: false,
            error: lastError?.message || 'All retry attempts failed',
            attempts: maxRetries + 1
        };
    }

    async complete(prompt, systemPrompt = '', options = {}) {
        const params = {
            model: options.model || 'claude-sonnet-4-5-20250929',
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.7,
            system: systemPrompt || undefined,
            messages: [{
                role: 'user',
                content: prompt
            }]
        };

        return await this.makeRequest(params, options);
    }

    async vision(imageData, prompt, mediaType = 'image/jpeg', options = {}) {
        const params = {
            model: options.model || 'claude-sonnet-4-5-20250929',
            max_tokens: options.maxTokens || 2000,
            temperature: options.temperature || 0.5,
            messages: [{
                role: 'user',
                content: [
                    {
                        type: 'image',
                        source: {
                            type: 'base64',
                            media_type: mediaType,
                            data: imageData
                        }
                    },
                    {
                        type: 'text',
                        text: prompt
                    }
                ]
            }]
        };

        return await this.makeRequest(params, options);
    }

    getStatus() {
        return {
            lastRequestTime: this.lastRequestTime,
            timeSinceLastRequest: Date.now() - this.lastRequestTime,
            minTimeBetweenRequests: this.minTimeBetweenRequests
        };
    }
}

const claudeApi = new ClaudeApiHelper();

export default claudeApi;