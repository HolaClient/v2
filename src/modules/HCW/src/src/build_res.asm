BITS 64
default rel

global brf_asm

section .rodata
    align 16
    ok_s:      db "HTTP/1.1 200 OK", 13, 10
    ok_l:     equ $ - ok_s
    nf_s:     db "HTTP/1.1 404 Not Found", 13, 10
    nf_l:     equ $ - nf_s
    cl_s:     db "Content-Length: "
    cl_l:     equ $ - cl_s
    cn_s:     db "Connection: close", 13, 10
    cn_l:     equ $ - cn_s
    cr_s:     db 13, 10
    cr_l:     equ $ - cr_s
    dbg_s:    db "Debug: Processing request, status=%d", 10, 0
    dbg_l:    equ $ - dbg_s

section .text

brf_asm:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 64
    push    rbx
    push    r12
    push    r13
    push    r14
    push    r15

    test    rdi, rdi
    jz      .err
    test    rsi, rsi
    jz      .err
    
    mov     rbx, rdi
    mov     r12, rsi
    xor     r13, r13
    mov     r15, 8192

    mov     eax, [rbx]
    test    eax, eax
    jz      .err
    
    cmp     eax, 200
    je      .ok
    cmp     eax, 404
    je      .nf
    mov     eax, 500
    
.ok:
    mov     rcx, ok_l
    add     rcx, r13
    cmp     rcx, r15
    ja      .err
    
    mov     rcx, ok_l
    lea     rsi, [ok_s]
    lea     rdi, [r12 + r13]
    rep     movsb
    add     r13, ok_l
    jmp     .hdrs

.nf:
    mov     rcx, nf_l
    add     rcx, r13
    cmp     rcx, r15
    ja      .err
    
    lea     rsi, [nf_s]
    lea     rdi, [r12 + r13]
    mov     rcx, nf_l
    rep     movsb
    add     r13, nf_l

.hdrs:
    mov     rcx, cl_l
    add     rcx, r13
    cmp     rcx, r15
    ja      .err
    
    lea     rsi, [cl_s]
    lea     rdi, [r12 + r13]
    mov     rcx, cl_l
    rep     movsb
    add     r13, cl_l
    
    mov     rax, [rbx + 32]
    lea     rdi, [r12 + r13]
    push    rax
    call    wnum
    pop     rcx
    add     r13, rax
    
    mov     rcx, cr_l
    add     rcx, r13
    cmp     rcx, r15
    ja      .err
    
    lea     rsi, [cr_s]
    lea     rdi, [r12 + r13]
    mov     rcx, cr_l
    rep     movsb
    add     r13, cr_l
    
    mov     rcx, cn_l
    add     rcx, r13
    cmp     rcx, r15
    ja      .err
    
    lea     rsi, [cn_s]
    lea     rdi, [r12 + r13]
    mov     rcx, cn_l
    rep     movsb
    add     r13, cn_l
    
    mov     rcx, cr_l
    add     rcx, r13
    cmp     rcx, r15
    ja      .err
    
    lea     rsi, [cr_s]
    lea     rdi, [r12 + r13]
    mov     rcx, cr_l
    rep     movsb
    add     r13, cr_l

    mov     rsi, [rbx + 24]
    test    rsi, rsi
    jz      .fin
    mov     rcx, [rbx + 32]
    test    rcx, rcx
    jz      .fin
    
    mov     rax, rcx
    add     rax, r13
    cmp     rax, r15
    ja      .err
    
    lea     rdi, [r12 + r13]
    rep     movsb
    add     r13, rcx

.fin:
    mov     rax, r13

.ret:
    pop     r15
    pop     r14
    pop     r13
    pop     r12
    pop     rbx
    pop     rbp
    ret

.err:
    xor     rax, rax
    jmp     .ret

wnum:
    push    rbp
    mov     rbp, rsp
    sub     rsp, 32
    
    mov     rcx, 0
    mov     r8, 10
    mov     r9, rax
    
.div:
    xor     rdx, rdx
    div     r8
    add     dl, '0'
    mov     [rsp + rcx], dl
    inc     rcx
    test    rax, rax
    jnz     .div
    
    mov     rax, rcx
    dec     rcx
    
.wr:
    mov     dl, [rsp + rcx]
    mov     [rdi], dl
    inc     rdi
    dec     rcx
    jns     .wr
    
    leave
    ret
