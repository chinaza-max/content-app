// =============================
// 1️⃣ HTTP Request Builder
// =============================
import axios from 'axios';
import mustache from 'mustache';
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';

export interface HttpRequestConfig {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: string;
  contentType?: string;
}

export class HttpRequestBuilder {
  private url: string = '';
  private method: HttpMethod = 'POST';
  private headers: Record<string, string> = {};
  private body?: any;
  private contentType?: string;
  private timeout: number = 15000;

  /**
   * Set the request URL
   */
  setUrl(url: string): this {
    this.url = url;
    return this;
  }

  /**
   * Set the HTTP method
   */
  setMethod(method: HttpMethod): this {
    this.method = method;
    return this;
  }

  /**
   * Set a single header
   */
  setHeader(key: string, value: string): this {
    this.headers[key] = value;
    return this;
  }

  /**
   * Set multiple headers at once
   */
  setHeaders(headers: Record<string, string>): this {
    this.headers = { ...this.headers, ...headers };
    return this;
  }

  /**
   * Set the request body
   */
  setBody(body: any): this {
    this.body = body;
    return this;
  }

  /**
   * Set content type and auto-apply header
   */
  setContentType(contentType: string): this {
    this.contentType = contentType;
    this.headers['Content-Type'] = contentType;
    return this;
  }

  /**
   * Set request timeout
   */
  setTimeout(timeout: number): this {
    this.timeout = timeout;
    return this;
  }

  /**
   * Build the final Axios config
   */
  build(): any {
    const config: any = {
      url: this.url,
      method: this.method,
      headers: this.headers,
      timeout: this.timeout,
    };

    // Only attach body for non-GET requests
    if (this.method !== 'GET' && this.body !== undefined) {
      if (this.contentType?.includes('json')) {
        config.data = typeof this.body === 'string' ? JSON.parse(this.body) : this.body;
      } else if (this.contentType?.includes('x-www-form-urlencoded')) {
        config.data = this.body;
      } else {
        config.data = this.body;
      }
    }

    return config;
  }
}

// =============================
// 2️⃣ Template Renderer
// =============================
export class TemplateRenderer {
  private context: Record<string, any> = {};

  /**
   * Set the rendering context
   */
  setContext(context: Record<string, any>): this {
    this.context = context;
    return this;
  }

  /**
   * Add a value to the context
   */
  addToContext(key: string, value: any): this {
    this.context[key] = value;
    return this;
  }

  /**
   * Add Mustache helper functions
   */
  addHelpers(): this {
    // URL encoding helper
    this.context.urlEncode = () => {
      return (text: string, render: (v: string) => string) =>
        encodeURIComponent(render(text));
    };

    // Base64 encoding helper
    this.context.base64Encode = () => {
      return (text: string, render: (v: string) => string) =>
        Buffer.from(render(text)).toString('base64');
    };

    // JSON stringify helper
    this.context.jsonStringify = () => {
      return (text: string, render: (v: string) => string) =>
        JSON.stringify(render(text));
    };

    return this;
  }

  /**
   * Render a template string
   */
  render(template: string): string {
    return mustache.render(template, this.context);
  }

  /**
   * Render and parse as JSON
   */
  renderJson(template: string): Record<string, any> {
    const rendered = this.render(template);
    return JSON.parse(rendered);
  }
}

// =============================
// 3️⃣ HTTP Gateway Service
// =============================
export interface GatewayRequestOptions {
  urlTemplate: string;
  method: HttpMethod;
  headersTemplate?: string;
  bodyTemplate?: string;
  contentType?: string;
  context: Record<string, any>;
  timeout?: number;
}

export class HttpGatewayService {
  /**
   * Send an HTTP request using templates and context
   */
  static async sendRequest(options: GatewayRequestOptions): Promise<any> {
    const {
      urlTemplate,
      method,
      headersTemplate,
      bodyTemplate,
      contentType,
      context,
      timeout = 15000,
    } = options;

    // 1️⃣ Setup template renderer
    const renderer = new TemplateRenderer()
      .setContext(context)
      .addHelpers();

    // 2️⃣ Render URL
    const url = renderer.render(urlTemplate);

    // 3️⃣ Build request
    const builder = new HttpRequestBuilder()
      .setUrl(url)
      .setMethod(method)
      .setTimeout(timeout);

    // 4️⃣ Render and set headers
    if (headersTemplate) {
      const headers = renderer.renderJson(headersTemplate);
      builder.setHeaders(headers);
    }

    // 5️⃣ Set content type
    if (contentType) {
      builder.setContentType(contentType);
    }

    // 6️⃣ Render and set body
    if (bodyTemplate && method !== 'GET') {
      const body = renderer.render(bodyTemplate);
      builder.setBody(body);
    }

    // 7️⃣ Execute request
    const axiosConfig = builder.build();
    
    try {
      const response = await axios(axiosConfig);
      return response.data;
    } catch (error: any) {
      console.error('💥 HTTP Gateway Error:', error.message);
      if (error.response) {
        console.error('🧯 API Response Error:', error.response.data);
      }
      throw error;
    }
  }
}
