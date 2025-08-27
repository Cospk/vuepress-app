---
title: Go 反射与interface拾遗
source_url: 'https://studygolang.com/articles/11994'
category: Go原理教程
---
```

```
 Go能实现接口的动态性和反射的基础是：编译期为运行时提供了类型信息。interface底层有两种结构，上一节讲了带方法的iface，这一节补充不带方法的eface结构。 ## \[\](#interface之eface "interface之eface")interface之eface Go中的任何对象都可以表示为\*\*interface{}\*\*。它扮演的角色与C中的\*\*void\\\*\*\*差不多，区别在于interface{}中包含有类型信息，可以实现反射。 > \*\*eface数据结构描述\*\*：\`gcdata\`域用于垃圾回收，\`size\`描述类型的大小，\`hash\`表示数据的hash值，\`align\`是对齐，\`fieldalign\`是这个数据嵌入结构体时的对齐，\`kind\`是枚举值。\`alg\`是函数指针的数组，存储了\`hash/equal/print/copy\`四个函数操作。\`uncommentType\`指向这个类型的方法集。 
```
go type eface struct { \_type \*\_type data unsafe.Pointer } type \_type struct { size uintptr ptrdata uintptr // size of memory prefix holding all pointers hash uint32 \_unused uint8 align uint8 fieldalign uint8 kind uint8 alg \*typeAlg gcdata \*byte \_string \*string x \*uncommontype ptrto \*\_type zero \*byte // ptr to the zero value for this type } 
```
 ### \[\](#运行时convT2E "运行时convT2E")运行时convT2E \*\*T2E的转换\*\* 赋值给空interface{}，运行时会调用conv类函数\`convT2E\`。与\`convT2I\`一样，向interface的类型转换\`var i interface{} = u\`都存在内存拷贝。看iface.go源码时发现\`convI2I\`等接口转换时没有分配内存和拷贝数据，原因可能是Go接口内部的data域，并不开放途径让外部修改，所以接口之间转换可以用同一块内存。 
```
go func convT2E(t \*\_type, elem unsafe.Pointer, x unsafe.Pointer) (e interface{}) { ep := (\*eface)(unsafe.Pointer(&e)) ... if x == nil { x = newobject(t) } typedmemmove(t, x, elem) ep.\_type = t ep.data = x } return } 
```
 下面的例子中修改u并不影响i interface的内存数据，因为i在赋值时通过convT2E对u进行了拷贝。这也是\*\*反射非指针变量时无法直接改变变量数据\*\*的原因，因为反射会先把变量转成interface类型，拿到的是变量的副本。 
```
go u := User{1, "Tom"} var i interface{} = u u.id = 2 u.name = "Jack" // u {2, "Jack"} // i.(User) {1, "Tom"} 
```
 ### \[\](#nil的理解 "nil的理解")nil的理解 未初始化的interface类型，指针，函数，slice，cannel和map都是nil的。\*\*对于interface比较特殊，只有eface的type和data都是nil，或者iface的type和data都是nil时，interface{}才是nil。\*\* 
```
go type Duck interface{ Walk() } var i interface{} // nil var d Duck // nil var v \*T // nil i = v // (\*T)(nil) not nil 
```
 ### \[\](#type-assertion "type assertion")type assertion 严格来说Go并不支持泛型编程，但通过interface可实现泛型编程，后面reflect浅析中有个通过reflect实现泛型的例子。interface像其它类型转换的时候一般需要断言。下面只给出了eface的例子，当然也可以通过断言来判断某个类型是否实现了某个接口。 
```
go func do(v interface{}) { n, ok := v.(int) if !ok {...} } func doswitch(i interface{}) { switch v := i.(type) { case int: ... } } 
```
 对应的go源码在iface.go当中。\`assertE2T\`过程判断了eface的type字段是否和目标type相等，相等则还需要拷贝数据。\`assertI2T\`也要拷贝数据，不过他比较的是iface.tab.\\\_type与目标type是否一致。 
```
go func assertE2T(t \*\_type, e interface{}, r unsafe.Pointer) { ep := (\*eface)(unsafe.Pointer(&e)) if ep.\_type == nil { panic(&TypeAssertionError{"", "", \*t.\_string, ""}) } if ep.\_type != t { panic(&TypeAssertionError{"", \*ep.\_type.\_string, \*t.\_string, ""}) } if r != nil { if isDirectIface(t) { writebarrierptr((\*uintptr)(r), uintptr(ep.data)) } else { typedmemmove(t, r, ep.data) } } } 
```
 ## \[\](#reflect浅析 "reflect浅析")reflect浅析 反射机制提供了检查存储在接口变量中的\\\[类型 值\]对的机制。根据\[Laws Of Reflection\](https://studygolang.com/articles/2157)Go的反射可以总结三点，即反射可以从interface中获取reflect对象；同时可以通过\`Interface()\`方法恢复reflect对象为一个interface；如果要修改反射对象，该对象必须是\`settable\`的。 ### \[\](#TypeOf与ValueOf实现 "TypeOf与ValueOf实现")TypeOf与ValueOf实现 获取反射对象的实现，是基于对interface底层数据的操作。首先对象经过了\`convT2E\`，然后emptyInterface直接指向了eface的type字段。\`typeOf\`返回的\*\*Type\*\*是接口，在类型\\\_type上实现了很多操作。\`valueOf\`返回的就是\*\*Value\*\*结构体，它包含了数据域和type域信息。 
```
go func TypeOf(i interface{}) Type { eface := \*(\*emptyInterface)(unsafe.Pointer(&i)) return toType(eface.typ) } func ValueOf(i interface{}) Value { if i == nil { return Value{} } escapes(i) return unpackEface(i) } func unpackEface(i interface{}) Value { e := (\*emptyInterface)(unsafe.Pointer(&i)) t := e.typ if t == nil { return Value{} } f := flag(t.Kind()) if ifaceIndir(t) { f |= flagIndir } return Value{t, unsafe.Pointer(e.word), f} } 
```
 
```
go type Type interface{ ... Method(int) Method MethodByName(string) (Method, bool) NumMethod() int NumField() Field(i) StructField FieldByName(name string) (StructField, bool) ... } type Value struct { typ \*rtype ptr unsafe.Pointer flag } 
```
 ### \[\](#通过Type获取Struct-Field信息 "通过Type获取Struct Field信息")通过Type获取Struct Field信息 可以通过reflect获取类型实例的结构体信息，比如每个field的名字类型或标签。 
```
go // A StructField describes a single field in a struct. type StructField struct { Name string // Name is the field name. PkgPath string Type Type // field type Tag StructTag // field tag string Offset uintptr // offset within struct, in bytes Index \[\]int // index sequence for Type.FieldByIndex Anonymous bool // is an embedded field } type Person struct { Name string \`json:"name"\` Age int \`json:"age"\` } func main() { nino := Person{"nino", 27} t := reflect.TypeOf(nino) n := t.NumField() for i := 0; i < n; i++ { fmt.Println(t.Field(i).Name, t.Field(i).Type, t.Field(i).Tag) } } // Name string json:"name" // Age int json:"age" 
```
 ### \[\](#通过Value实现泛型 "通过Value实现泛型")通过Value实现泛型 为了解决method接受不同类型的slice为入参，可以用反射来完成。对于可记长度和可随机访问的类型，可以通过\`v.Len()\`和\`v.Index(i)\`获取他们的第几个元素。 > \*\*v.Index(i).Interface()\*\*将reflect.Value反射回了interface类型 
```
go func method(in interface{}) (ok bool) { v := reflect.ValueOf(in) if v.Kind() == reflect.Slice { ok = true } else { return false } num := v.Len() for i := 0; i < num; i++ { fmt.Println(v.Index(i).Interface()) } return ok } func main() { s := \[\]int{1, 3, 5, 7, 9} b := \[\]float64{1.2, 3.4, 5.6, 7.8} method(s) method(b) } 
```
 ### \[\](#通过Elem修改reflect对象值 "通过Elem修改reflect对象值")通过Elem修改reflect对象值 \*\*对LawsOfReflect第三点的理解\*\* \`reflect.ValueOf\` 如果直接传入x，则v是x的一个副本的\*\*reflect\*\*对象。修改v的值并不会作用到x上。p是指向x的指针的reflect对象，修改p的值是在修改指针的指向，同样不会作用到x上，因此也是\*\*CanNotSet\*\*的。只有通过\`p.Elem()\`相当于获取了\\\*p的\*\*reflect\*\*对象，这时才能使用\`v.SetFloat(7.2)\`来对原始的数据进行修改。 
```
go var x float64 = 3.4 v := reflect.ValueOf(x) // can not set p := reflect.ValueOf(&x) // can not set e := p.Elem() // can set 
```
