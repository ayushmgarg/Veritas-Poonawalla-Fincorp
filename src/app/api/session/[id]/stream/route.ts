import { getServiceClient } from "@/lib/supabase";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder();

      const sendEvent = (event: string, data: unknown) => {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      };

      const db = getServiceClient();

      const channel = db
        .channel(`session-${id}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", filter: `session_id=eq.${id}` },
          (payload) => {
            sendEvent(payload.table, {
              type: payload.eventType,
              record: payload.new,
            });
          }
        )
        .subscribe();

      sendEvent("connected", { session_id: id, timestamp: Date.now() });

      const heartbeat = setInterval(() => {
        sendEvent("heartbeat", { timestamp: Date.now() });
      }, 15000);

      const cleanup = () => {
        clearInterval(heartbeat);
        channel.unsubscribe();
      };

      controller.close = new Proxy(controller.close, {
        apply(target, thisArg, args) {
          cleanup();
          return Reflect.apply(target, thisArg, args);
        },
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
