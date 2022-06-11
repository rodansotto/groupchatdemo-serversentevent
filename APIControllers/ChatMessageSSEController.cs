using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using System.Web.Http;

namespace MyMvc5App.APIControllers
{
    public class ChatMessageSSEController : ApiController
    {
        public static Dictionary<int, Queue<string>> chatMessageQueues = new Dictionary<int, Queue<string>>();
        public static int numUsers = 0;

        //public Queue<string> chatMessages;
        public int userID;

        // GET: api/ChatMessageSSE
        // this API will return a unique user ID to client
        public int Get()
        {
            // new user, so create user's queue and return user ID
            numUsers++;
            chatMessageQueues.Add(numUsers, new Queue<string>());
            return numUsers;
        }

        // GET: api/ChatMessageSSE/id
        // this API sends server-sent events (SSE) to client when group chat messages come in
        public HttpResponseMessage Get(int id)
        {
            //chatMessages = chatMessageQueues[id];
            userID = id;
            HttpResponseMessage response = Request.CreateResponse();
            response.Content = new PushStreamContent(OnChatMessageAvailable, "text/event-stream");
            return response;
        }

        private async Task OnChatMessageAvailable(Stream stream, HttpContent content, TransportContext context)
        {
            StreamWriter sw = new StreamWriter(stream);
#if DEBUG
            content.Headers.Add("Access-Control-Allow-Origin", "http://localhost:16909");
#else
            content.Headers.Add("Access-Control-Allow-Origin", "http://rodansotto.com");
#endif

            DateTime startDate = DateTime.Now;
            while (startDate.AddMinutes(30) > DateTime.Now)
            {
                // SSE event stream can contain multiple "{fieldName}:{value}\n"
                // an additional "\n" marks the end of the event stream, dispatching the event on the client
                string fieldName = "data";

                string message = "";
                if (chatMessageQueues[userID].Count > 0)
                {
                    message = chatMessageQueues[userID].Dequeue();
                }

                string[] messageSplit = message.Split('\n');
                string eventStream = string.Empty;
                foreach (string value in messageSplit)
                {
                    eventStream += $"{fieldName}:{value}\n";
                }
                eventStream += "\n";

                sw.Write(eventStream);
                sw.Flush(); // send data to client

                await Task.Delay(250);
            }

            sw.Close();

            // we're closing the SSE connection so remove user's queue too
            chatMessageQueues.Remove(userID);
        }

        // POST: api/ChatMessageSSE
        // data: "{userName}:{message}" e.g. "rsotto:Hello, World!"
        // content-type: application/json
        public void Post([FromBody]string value)
        {
            // send chat message to all users
            foreach (var q in chatMessageQueues.Values)
            {
                q.Enqueue(value);
            }
        }
    }
}