import { validate } from "class-validator";

import { UpdateCommentRequestDto } from "./update-comment-request.dto";

describe("UpdateCommentRequestDto", () => {
    it("accepts legacy credentials up to 200 characters", async () => {
        const dto = Object.assign(new UpdateCommentRequestDto(), {
            content: "updated",
            password: "a".repeat(200),
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(0);
    });

    it("rejects credentials longer than 200 characters", async () => {
        const dto = Object.assign(new UpdateCommentRequestDto(), {
            content: "updated",
            password: "a".repeat(201),
        });

        const errors = await validate(dto);

        expect(errors).toHaveLength(1);
        expect(errors[0].constraints).toHaveProperty("maxLength");
    });
});
