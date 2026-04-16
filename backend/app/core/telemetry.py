import logging
import os
from opentelemetry import trace
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.instrumentation.fastapi import FastAPIInstrumentor
from opentelemetry.trace import get_current_span

class TraceIdFilter(logging.Filter):
    """
    Injects trace_id into logging records.
    This allows Loki to link logs to Tempo traces.
    """
    def filter(self, record):
        span = get_current_span()
        if span and span.get_span_context().is_valid:
            record.trace_id = format(span.get_span_context().trace_id, '032x')
        else:
            record.trace_id = "00000000000000000000000000000000"
        return True

def setup_telemetry(app, service_name="nexus-backend"):
    # 1. Setup Resource
    resource = Resource.create({"service.name": service_name})

    # 2. Setup Tracing
    tempo_url = os.getenv("TEMPO_URL", "http://tempo:4317")
    provider = TracerProvider(resource=resource)
    processor = BatchSpanProcessor(OTLPSpanExporter(endpoint=tempo_url, insecure=True))
    provider.add_span_processor(processor)
    trace.set_tracer_provider(provider)

    # 3. Instrument FastAPI
    FastAPIInstrumentor.instrument_app(app)

    # 4. Setup Logging Linkage
    # We modify the root logger to include trace_id in every message
    handler = logging.StreamHandler()
    handler.addFilter(TraceIdFilter())
    formatter = logging.Formatter(
        '[%(asctime)s] %(levelname)s in %(module)s: [trace_id=%(trace_id)s] %(message)s'
    )
    handler.setFormatter(formatter)
    
    root_logger = logging.getLogger()
    # Remove existing handlers to avoid duplicates in Docker
    for h in root_logger.handlers[:]:
        root_logger.removeHandler(h)
    root_logger.addHandler(handler)
    root_logger.setLevel(logging.INFO)

    logging.info(f"Telemetry initialized for {service_name}. Exporting to {tempo_url}")
