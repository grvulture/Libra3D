jest.mock("axios", () => ({
  __esModule: true,
  default: {
    create: jest.fn(() => ({ get: jest.fn() })),
  },
}));

describe("ticket request deduplication", () => {
  it("debug", async () => {
    const { fetchTicket, resetTicketRequests } = require("./tickets");
    resetTicketRequests();
    const axios = require("axios");
    const get = jest.fn().mockReturnValue(Promise.resolve({ data: { id: "ticket-1" } }));
    axios.default.create.mockReturnValue({ get });

    const first = fetchTicket("ticket-1");
    const second = fetchTicket("ticket-1");
    console.log("first===second", first === second);
  });
});
