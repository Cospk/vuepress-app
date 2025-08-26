---
title: Golang协程栈概述
source_url: 'https://studygolang.com/articles/11858'
category: Go原理教程
---

<pre><code><span></span>(gdb) disas
Dump of assembler code for function main.main:
0x00000000004010b0 <main.main+0>:       mov    %fs:0xfffffffffffffff8,%rcx
0x00000000004010b9 <main.main+9>:       cmp    0x10(%rcx),%rsp
0x00000000004010bd <main.main+13>:      jbe    0x4010de <main.main+46>
0x00000000004010bf <main.main+15>:      sub    $0x18,%rsp
0x00000000004010c3 <main.main+19>:      movq   $0x1,(%rsp)
0x00000000004010cb <main.main+27>:      movq   $0x2,0x8(%rsp)
0x00000000004010d4 <main.main+36>:      callq  0x401000 <main.f>
0x00000000004010d9 <main.main+41>:      add    $0x18,%rsp
0x00000000004010dd <main.main+45>:      retq

0x00000000004010de <main.main+46>:      callq  0x44abd0 <runtime.morestack_noctxt>
0x00000000004010e3 <main.main+51>:      jmp    0x4010b0 <main.main>
0x00000000004010e5 <main.main+53>:      add    %al,(%rax)
0x00000000004010e7 <main.main+55>:      add    %al,(%rax)
0x00000000004010e9 <main.main+57>:      add    %al,(%rax)
0x00000000004010eb <main.main+59>:      add    %al,(%rax)
0x00000000004010ed <main.main+61>:      add    %al,(%rax)
0x00000000004010ef <main.main+63>:      add    %ah,-0x75(%rax,%rcx,2)
End of assembler dump.
(gdb) disas
Dump of assembler code for function main.f:
0x0000000000401000 <main.f+0>:  mov    %fs:0xfffffffffffffff8,%rcx
0x0000000000401009 <main.f+9>:  cmp    0x10(%rcx),%rsp
0x000000000040100d <main.f+13>: jbe    0x401097 <main.f+151>
0x0000000000401013 <main.f+19>: sub    $0x20,%rsp
0x0000000000401017 <main.f+23>: mov    0x28(%rsp),%rbx
0x000000000040101c <main.f+28>: mov    0x30(%rsp),%rbp
0x0000000000401021 <main.f+33>: add    %rbp,%rbx
0x0000000000401024 <main.f+36>: mov    %rbx,0x10(%rsp)
0x0000000000401029 <main.f+41>: xor    %eax,%eax
0x000000000040102b <main.f+43>: mov    %rax,0x18(%rsp)
0x0000000000401030 <main.f+48>: cmp    $0x3e8,%rax
0x0000000000401036 <main.f+54>: jge    0x401088 <main.f+136>
......
0x0000000000401088 <main.f+136>:        mov    0x10(%rsp),%rbx
0x000000000040108d <main.f+141>:        mov    %rbx,0x38(%rsp)
0x0000000000401092 <main.f+146>:        add    $0x20,%rsp
</code></pre>