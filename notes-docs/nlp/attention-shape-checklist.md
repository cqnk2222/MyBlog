# Attention Shape Checklist

When implementing attention by hand, shape bookkeeping usually breaks earlier than the theory.

## Minimal checklist

Given input `x` with shape `[batch, tokens, dim]`:

- project into `Q`, `K`, `V`
- split into heads
- transpose dimensions correctly
- confirm score matrix shape is `[batch, heads, tokens, tokens]`

## Common mistakes

1. Forgetting the key transpose.
2. Applying softmax on the wrong axis.
3. Reshaping before checking layout assumptions.

## Rule of thumb

Write down the tensor shape after every line before debugging the math.
