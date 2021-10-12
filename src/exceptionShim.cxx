// Workaround for current lack of exception support

#ifdef __cplusplus

#include <stdlib.h>

extern "C" {

void * __cxa_allocate_exception(void *)
{
  abort();
}

void __cxa_throw(void *, void *, void *)
{
  abort();
}

}

#endif // __cplusplus
