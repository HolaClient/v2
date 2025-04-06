BITS 64
DEFAULT REL

%ifidn __OUTPUT_FORMAT__, elf64
    %macro DECLARE_EXTERN 1
        extern %1 wrt ..got
    %endmacro
    %macro EXTERN_CALL 1
        call [rel %1 wrt ..got]
    %endmacro
%else
    %macro DECLARE_EXTERN 1
        extern %1
    %endmacro
    %macro EXTERN_CALL 1
        call %1
    %endmacro
%endif

section .data
    align 16
    response_200_ok:
        db 'HTTP/1.1 200 OK', 13, 10
        db 'Content-Type: application/json', 13, 10
        db 'Content-Length: 15', 13, 10
        db 'Connection: keep-alive', 13, 10
        db 13, 10
        db '{"status":"ok"}'
    response_200_ok_len equ $ - response_200_ok

    response_404_notfound:
        db 'HTTP/1.1 404 Not Found', 13, 10
        db 'Content-Length: 0', 13, 10
        db 13, 10
    response_404_len equ $ - response_404_notfound

    response_500_error:
        db 'HTTP/1.1 500 Internal Server Error', 13, 10
        db 'Content-Length: 0', 13, 10
        db 13, 10
    response_500_len equ $ - response_500_error

    align 64
    lookup_table:
        dq 0x20544547, 0
        dq 0x54534F50, 1
        dq 0x20545550, 2
        dq 0x54454C45, 3
        
    align 64
    static_responses:
        dq response_200_ok
        dq response_404_notfound
        dq response_500_error

    align 64
    method_handlers:
        dq response_200_ok
        dq response_200_ok
        dq response_404_notfound
        dq response_500_error

    align 16
    http_response_data:
        db 'HTTP/1.1 200 OK', 13, 10
        db 'Content-Type: application/json', 13, 10
        db 'Content-Length: 15', 13, 10
        db 'Connection: keep-alive', 13, 10
        db 13, 10
        db '{"status":"ok"}'
    response_len equ $ - http_response_data

    align 64
    response_ok:
        db 'HTTP/1.1 200 OK', 13, 10
        db 'Content-Type: application/json', 13, 10
        db 'Content-Length: 15', 13, 10
        db 'Connection: keep-alive', 13, 10
        db 13, 10
        db '{"status":"ok"}'
    response_ok_len equ $ - response_ok
    
    align 16
    space db " "
    colon db ":"

    align 16
    ok_response:
        db 'HTTP/1.1 200 OK', 13, 10
        db 'Content-Type: application/json', 13, 10
        db 'Content-Length: 15', 13, 10
        db 'Connection: keep-alive', 13, 10
        db 13, 10
        db '{"status":"ok"}', 0
    .len: equ $ - ok_response

section .rodata
    align 16
    http_ok:     db 'HTTP/1.1 200 OK', 13, 10
    .len:        equ $ - http_ok
    
    align 16
    http_json:   db 'Content-Type: application/json', 13, 10
    .len:        equ $ - http_json
    
    align 16
    keep_alive: db 'Connection: keep-alive', 13, 10
    .len:       equ $ - keep_alive
    
    align 16
    crlf:       db 13, 10
    .len:       equ $ - crlf

    align 16
    http_ok_header:
        db 'HTTP/1.1 200 OK', 13, 10
        db 'Content-Type: application/json', 13, 10
        db 'Content-Length: 15', 13, 10
        db 'Connection: keep-alive', 13, 10
        db 13, 10
        db '{"status":"ok"}'
    .len: equ $ - http_ok_header

    align 16
    http_404_header:
        db 'HTTP/1.1 404 Not Found', 13, 10
        db 'Content-Length: 0', 13, 10
        db 13, 10
    .len: equ $ - http_404_header

    align 16
    delimiter:
        db 13, 10, 13, 10
    .len: equ $ - delimiter

section .text

extern send
extern recv

global parse_req:function
global send_resp:function

GET_METHOD   equ 0x20544547
POST_METHOD  equ 0x54534F50
PUT_METHOD   equ 0x20545550
HEAD_METHOD  equ 0x44414548

%define MAX_HEADER_SIZE 8192
%define HTTP_GET    0x20544547
%define HTTP_POST   0x54534F50
%define HTTP_PUT    0x20545550
%define HTTP_HEAD   0x44414548

%define METHOD_GET    0x20544547
%define METHOD_POST   0x54534F50
%define METHOD_PUT    0x20545550

%ifdef PIC
    %define CALL_EXTERNAL(func) call func wrt ..plt
%else
    %define CALL_EXTERNAL(func) call func
%endif

parse_req:
    push rbp
    mov rbp, rsp
    push rbx
    push r12
    push r13
    push r14
    
    %ifidn __OUTPUT_FORMAT__, win64
        mov r12, rcx
        mov rsi, rdx
        mov rdx, r8
        mov rdi, r12
    %else
        mov r12, rdi
        mov r13, rsi
        mov r14, rdx
    %endif
    
    mov eax, [r13]
    
    cmp eax, GET_METHOD
    je .fast_response
    cmp eax, POST_METHOD
    je .fast_response
    jmp .error

.fast_response:
    mov rdi, r12
    lea rsi, [rel http_ok]
    mov edx, http_ok.len
    call send wrt ..plt
    test rax, rax
    jle .error
    
    mov rdi, r12
    lea rsi, [rel http_json]
    mov edx, http_json.len
    call send wrt ..plt
    test rax, rax
    jle .error
    
    mov rdi, r12
    lea rsi, [rel keep_alive]
    mov edx, keep_alive.len
    call send wrt ..plt
    test rax, rax
    jle .error
    
    mov rdi, r12
    lea rsi, [rel crlf]
    mov edx, crlf.len
    call send wrt ..plt
    test rax, rax
    jle .error
    
    mov eax, 1
    jmp .done

.error:
    xor eax, eax

.done:
    pop r14
    pop r13
    pop r12
    pop rbx
    pop rbp
    ret

send_resp:
    push rbp
    mov rbp, rsp
    mov rdi, rdi
    lea rsi, [rel http_ok_header]
    mov edx, http_ok_header.len
    call send wrt ..plt
    pop rbp
    ret