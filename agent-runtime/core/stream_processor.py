import logging
from typing import AsyncGenerator, Dict, Any


class StreamProcessor:
    """Handles streaming response processing"""
    
    def __init__(self, logger: logging.Logger):
        self.logger = logger
    
    async def process_stream(self, stream, user_message: str) -> AsyncGenerator[Dict[str, Any], None]:
        """Process streaming events from the agent"""
        try:
            self.logger.info("Processing message with Strands Agent (streaming)...")
            
            async for event in stream:
                self.logger.debug(f"Streaming event: {event}")
                
                # Process different event types
                if "data" in event:
                    # Text chunk from the model
                    chunk = event["data"]
                    yield {
                        "type": "chunk",
                        "data": chunk,
                    }
                elif "current_tool_use" in event:
                    # Tool use information
                    tool_info = event["current_tool_use"]
                    yield {
                        "type": "tool_use",
                        "tool_name": tool_info.get("name", "Unknown tool"),
                        "tool_input": tool_info.get("input", {}),
                        "tool_id": tool_info.get("toolUseId", "")
                    }
                elif "reasoning" in event and event["reasoning"]:
                    # Reasoning information
                    yield {
                        "type": "reasoning",
                        "reasoning_text": event.get("reasoningText", "")
                    }
                elif "result" in event:
                    # Final result
                    result = event["result"]
                    final_response = self._extract_final_response(result)
                    
                    yield {
                        "type": "complete",
                        "final_response": final_response
                    }
                elif "event" in event and "metadata" in event["event"]:
                    metadata = event["event"]["metadata"]
                    yield {
                        "type": "metadata",
                        "metadata": metadata
                    }
                    
        except Exception as e:
            self.logger.error(f"Error in streaming mode: {str(e)}", exc_info=True)
            yield {"error": f"Error processing request with agent: {str(e)}"}
    
    def _extract_final_response(self, result) -> str:
        """Extract final response text from result object"""
        if hasattr(result, 'message') and hasattr(result.message, 'content'):
            if isinstance(result.message.content, list) and len(result.message.content) > 0:
                return result.message.content[0].get('text', '')
            else:
                return str(result.message.content)
        else:
            return str(result)
