---
title: Golang协程栈概述
source_url: 'https://studygolang.com/articles/11858'
category: Go原理教程
---
```
 (gdb) disas Dump of assembler code for function main.main: 0x00000000004010b0 : mov %fs:0xfffffffffffffff8,%rcx 0x00000000004010b9 : cmp 0x10(%rcx),%rsp 0x00000000004010bd : jbe 0x4010de 0x00000000004010bf : sub $0x18,%rsp 0x00000000004010c3 : movq $0x1,(%rsp) 0x00000000004010cb : movq $0x2,0x8(%rsp) 0x00000000004010d4 : callq 0x401000 0x00000000004010d9 : add $0x18,%rsp 0x00000000004010dd : retq 0x00000000004010de : callq 0x44abd0 0x00000000004010e3 : jmp 0x4010b0 0x00000000004010e5 : add %al,(%rax) 0x00000000004010e7 : add %al,(%rax) 0x00000000004010e9 : add %al,(%rax) 0x00000000004010eb : add %al,(%rax) 0x00000000004010ed : add %al,(%rax) 0x00000000004010ef : add %ah,-0x75(%rax,%rcx,2) End of assembler dump. (gdb) disas Dump of assembler code for function main.f: 0x0000000000401000 : mov %fs:0xfffffffffffffff8,%rcx 0x0000000000401009 : cmp 0x10(%rcx),%rsp 0x000000000040100d : jbe 0x401097 0x0000000000401013 : sub $0x20,%rsp 0x0000000000401017 : mov 0x28(%rsp),%rbx 0x000000000040101c : mov 0x30(%rsp),%rbp 0x0000000000401021 : add %rbp,%rbx 0x0000000000401024 : mov %rbx,0x10(%rsp) 0x0000000000401029 : xor %eax,%eax 0x000000000040102b : mov %rax,0x18(%rsp) 0x0000000000401030 : cmp $0x3e8,%rax 0x0000000000401036 : jge 0x401088 ...... 0x0000000000401088 : mov 0x10(%rsp),%rbx 0x000000000040108d : mov %rbx,0x38(%rsp) 0x0000000000401092 : add $0x20,%rsp 
```
