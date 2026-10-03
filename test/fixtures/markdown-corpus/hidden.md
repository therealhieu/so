# Hidden syntax

Inline `[[code-link]] #code-tag` and ``double `[[x]]` ticks`` stay hidden.
Inline math $[[math-link]] #math$ and $$x = [[y]]$$ stay hidden.
Comments %%[[comment-link]] #comment%% and <!-- [[html-link]] #html --> stay hidden.
Use `%%` to start a comment, then %% [[secret]] %% ends it; [[visible]] stays.

```markdown
[[fenced-link]] #fenced
```

~~~
![[tilde-embed]]
~~~

    [[indented-link]] #indented

$$
\text{[[block-math]]} #block
$$

%%
[[block-comment]] #block-comment
%%

<div>
[[html-block]] #html-block
</div>

After everything [[after]] #after
