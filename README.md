# input-props
A React component that provides a two-way data-binding feel to your forms controlled by a mobx state.

## How to use

Assuming you are using an observable object/store that holds your state:
```
<InputProps stateObject={store} propertyName='fieldName'>
    <input/>
</InputProps>
```

The code above will inject the `onChange` and `value` properties into the `input` element, so it updates the state automatically.

If you need to know when the input changed the value:
```
<InputProps stateObject={store} propertyName='fieldName' onValueChange={(newValue) => doStuffWithNewValue(newValue)}>
    <input/>
</InputProps>
```